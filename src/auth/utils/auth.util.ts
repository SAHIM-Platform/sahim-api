import { hash as bHash } from 'bcryptjs';
import { Injectable, Res } from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import { JwtPayload, JwtTokens } from '../interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { jwtConstants } from './constants';
import * as crypto from 'crypto';

@Injectable()
export class AuthUtil {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Hashes a password using bcrypt.
   * @param password - The password to hash.
   * @returns A promise that resolves to the hashed password.
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bHash(password, saltRounds);
  }

  /**
   * Generates a JWT token for a user.
   * @param sub - The subject (user ID) for the token.
   * @param tokenType - The type of token ('access' or 'refresh').
   * @param req - Optional Express request object for IP and device info.
   * @returns A promise that resolves to the generated JWT token.
   * @throws Error if token generation fails.
   */
  async generateJwtToken(
    sub: number,
    tokenType: 'access' | 'refresh',
    req?: Request,
  ): Promise<string> {
    const payload: JwtPayload = { sub, tokenType };
    const expiration = this.getTokenExpiration(tokenType);
    try {
      const token = await this.jwtService.signAsync(payload, {
        expiresIn: expiration,
      });
      if (tokenType === 'refresh') {
        await this.storeRefreshToken(sub, token, req);
      }
      return token;
    } catch (error) {
      throw new Error(`Error generating JWT token: ${error.message}`);
    }
  }

  /**
   * Retrieves the token expiration time based on the token type.
   * @param tokenType - The type of token ('access' or 'refresh').
   * @returns The expiration time as a string.
   */
  getTokenExpiration(tokenType: 'access' | 'refresh'): string {
    return tokenType === 'access'
      ? jwtConstants.expiration
      : jwtConstants.refreshExpiration;
  }

  /**
   * Calculates the expiration time for a given token type.
   * @param tokenType - The type of token ('access' or 'refresh').
   * @param unit - The unit of return value: 'ms' (milliseconds) or 'date' (Date object).
   * @returns Either milliseconds or a Date object.
   */
  calcTokenExpiration(
    tokenType: 'access' | 'refresh',
    unit: 'ms' | 'date' = 'ms',
  ): number | Date {
    const tokenExpirationPeriod =
      tokenType === 'access'
        ? jwtConstants.expiration
        : jwtConstants.refreshExpiration;

    const DAYS = Number(tokenExpirationPeriod.replace(/\D/g, ''));
    const expirationMs = DAYS * 24 * 60 * 60 * 1000;

    return unit === 'date' ? new Date(Date.now() + expirationMs) : expirationMs;
  }

  /**
   * Generates both access and refresh JWT tokens for a user.
   * @param sub - The subject (user ID) for the tokens.
   * @param req - Optional Express request object for IP and device info.
   * @returns A promise that resolves to an object containing the access and refresh tokens.
   */
  async generateJwtTokens(sub: number, req?: Request): Promise<JwtTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateJwtToken(sub, 'access'),
      this.generateJwtToken(sub, 'refresh', req),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * Stores a refresh token in the database.
   * @param userId - The ID of the user associated with the token.
   * @param refreshToken - The refresh token to store.
   * @param req - Express request object for IP and device info.
   */
  async storeRefreshToken(
    userId: number,
    refreshToken: string,
    req?: Request,
  ): Promise<void> {
    const expiresAt = this.calcTokenExpiration('refresh', 'date') as Date;
    const hashedToken = this.hashToken(refreshToken);
    await this.revokeAllRefreshTokens(userId);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
        deviceInfo: req?.headers['user-agent'] || null,
        ipAddress: req?.ip || null,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Retrieves a valid stored refresh token for a user.
   * @param refreshToken - The refresh token to find.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the found refresh token or null.
   */
  async getValidStoredRefreshTokenByUserId(
    refreshToken: string,
    userId: number,
  ) {
    const hashedToken = this.hashToken(refreshToken);
    return await this.prisma.refreshToken.findFirst({
      where: {
        token: hashedToken,
        userId: userId,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Returns common cookie options for setting and clearing cookies.
   */
  private getCookieOptions(): CookieOptions {
    const env =
      this.configService.get<string>('NODE_ENV', 'development') || 'production';
    const isProduction = env === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/auth/',
    };
  }

  /**
   * Sets a refresh token as an HTTP-only cookie in the response.
   * @param refreshToken - The refresh token to be set in the cookie.
   * @param res - The Express response object.
   */
  setRefreshTokenCookie(refreshToken: string, @Res() res: Response): void {
    res.cookie('refreshToken', refreshToken, {
      ...this.getCookieOptions(),
      maxAge: this.calcTokenExpiration('refresh', 'ms') as number,
    });
  }

  /**
   * Unset the refresh token cookie in the response.
   * @param res - The Express response object.
   */
  unsetRefreshTokenCookie(@Res() res: Response): void {
    res.clearCookie('refreshToken', this.getCookieOptions());
  }

  /**
   * Revokes all refresh tokens for a user.
   * @param userId - The ID of the user.
   * @param exceptTokenId - Optional token ID to exclude from revocation.
   */
  async revokeAllRefreshTokens(
    userId: number,
    exceptTokenId?: number,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
        ...(exceptTokenId && { id: { not: exceptTokenId } }),
      },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  /**
   * Checks if a token is expired based on its expiration date.
   * @param expiresAt - The expiration date of the token.
   * @returns True if the token is expired, false otherwise.
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Validates a refresh token and checks for suspicious activity.
   * @param refreshToken - The refresh token to validate.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a boolean indicating if the token is valid.
   */
  async validateRefreshToken(
    refreshToken: string,
    userId: number,
  ): Promise<boolean> {
    const storedToken = await this.getValidStoredRefreshTokenByUserId(
      refreshToken,
      userId,
    );

    if (!storedToken || !storedToken.user.isActive) {
      return false;
    }

    if (this.isTokenExpired(storedToken.expiresAt)) {
      await this.revokeExpiredToken(storedToken.id);
      return false;
    }

    return true;
  }

  /**
   * Revokes a specific refresh token.
   * @param tokenId - The ID of the token to revoke.
   */
  async revokeRefreshToken(tokenId: number): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true },
    });
  }

  /**
   * Cleans up expired refresh tokens.
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }],
      },
      data: { revoked: true },
    });
  }

  /**
   * Hashes a token using SHA-256 and a secret key.
   * @param token - The token to be hashed.
   * @returns The hashed token as a hexadecimal string.
   */
  hashToken(token: string): string {
    return crypto
      .createHmac('sha256', jwtConstants.secretKey)
      .update(token)
      .digest('hex');
  }

  /********** Private Helpers **********/

  /**
   * Marks an expired token as revoked in the database.
   * @param tokenId - The ID of the token to revoke.
   */
  private async revokeExpiredToken(tokenId: number): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }
}
