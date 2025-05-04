import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { JwtPayload, JwtTokens } from '../interfaces/jwt-payload.interface';
import { jwtConstants } from '../utils/constants';
import { RefreshTokenService } from './refresh-token.service';
import { UserService } from '@/users/services/user.service';
import { Request } from 'express';
import { TokenType } from '../enums/token-type.enum';
import { ExpirationUnit } from '../enums/expiration-unit.enum';

@Injectable()
export class TokenService {
  constructor(
    @Inject(forwardRef(() => RefreshTokenService))
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

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
    role: UserRole,
    tokenType: TokenType,
    req?: Request,
  ): Promise<string> {
    const payload: JwtPayload = { sub, tokenType, role };
    const expiration = this.getTokenExpiration(tokenType);
    try {
      const token = await this.jwtService.signAsync(payload, {
        expiresIn: expiration,
      });
      if (tokenType === TokenType.REFRESH) {
        await this.refreshTokenService.storeRefreshToken(sub, token, req);
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
  getTokenExpiration(tokenType: TokenType): string {
    return tokenType === TokenType.ACCESS
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
    tokenType: TokenType,
    unit: ExpirationUnit = ExpirationUnit.MS,
  ): number | Date {
    const tokenExpirationPeriod =
      tokenType === TokenType.ACCESS
        ? jwtConstants.expiration
        : jwtConstants.refreshExpiration;

    const DAYS = Number(tokenExpirationPeriod.replace(/\D/g, ''));
    const expirationMs = DAYS * 24 * 60 * 60 * 1000;

    return unit === ExpirationUnit.DATE ? new Date(Date.now() + expirationMs) : expirationMs;
  }

  /**
   * Generates both access and refresh JWT tokens for a user.
   * @param sub - The subject (user ID) for the tokens.
   * @param req - Optional Express request object for IP and device info.
   * @returns A promise that resolves to an object containing the access and refresh tokens.
   */
  async generateJwtTokens(sub: number, req?: Request): Promise<JwtTokens> {
    const user = await this.userService.findUserById(sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const [accessToken, refreshToken] = await Promise.all([
      this.generateJwtToken(sub, user.role, TokenType.ACCESS),
      this.generateJwtToken(sub, user.role, TokenType.REFRESH, req),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Checks if a token is expired based on its expiration date.
   * @param expiresAt - The expiration date of the token.
   * @returns True if the token is expired, false otherwise.
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
 
}
