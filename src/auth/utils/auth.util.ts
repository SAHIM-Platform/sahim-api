import { hash as bHash } from 'bcrypt';
import { Injectable, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtPayload, JwtTokens } from '../interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { jwtConstants } from './constants';
import { RefreshToken } from '@prisma/client';

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
   * @returns A promise that resolves to the generated JWT token.
   * @throws Error if token generation fails.
   */
  async generateJwtToken(
    sub: number,
    tokenType: 'access' | 'refresh',
  ): Promise<string> {
    const payload: JwtPayload = { sub, tokenType };
    const expiration = this.getTokenExpiration(tokenType);
    try {
      return this.jwtService.signAsync(payload, { expiresIn: expiration });
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
      this.generateJwtToken(sub, 'refresh'),
    ]);
    await this.storeRefreshToken(sub, refreshToken, req);
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

    await this.revokeAllRefreshTokens(userId);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
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
    return await this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
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
   * Removes sensitive information from a user object.
   * @param user - The user object to sanitize.
   * @returns A new object with sensitive fields removed.
   */
  sanitizeUser(user: any): Omit<any, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Sets a refresh token as an HTTP-only cookie in the response.
   * @param refreshToken - The refresh token to be set in the cookie.
   * @param res - The Express response object.
   */
  setRefreshTokenCookie(refreshToken: string, @Res() res: Response): void {
    const env =
      this.configService.get<string>('NODE_ENV', 'development') || 'production';
    const isProduction = env === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Boolean(isProduction),
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: this.calcTokenExpiration('refresh', 'ms') as number,
      path: '/auth/',
    });
  }

  /**
   * Unset the refresh token cookie in the response.
   * @param res - The Express response object.
   */
  unsetRefreshTokenCookie(@Res() res: Response): void {
    res.clearCookie('refreshToken', { path: '/auth/' });
  }
}
