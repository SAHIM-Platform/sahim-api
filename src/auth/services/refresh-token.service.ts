import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TokenService } from './token.service';
import { AuthUtil } from '../utils/auth.helpers';
import { Request } from 'express';
import { TokenType } from '../enums/token-type.enum';
import { ExpirationUnit } from '../enums/expiration-unit.enum';

@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthUtil))
    private readonly authutil: AuthUtil,    
  ) {}

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
    const expiresAt = this.tokenService.calcTokenExpiration(TokenType.REFRESH, ExpirationUnit.DATE) as Date;
    const hashedToken = this.authutil.hashToken(refreshToken);
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
        const hashedToken = this.authutil.hashToken(refreshToken);
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

    if (this.tokenService.isTokenExpired(storedToken.expiresAt)) {
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