import { hash as bHash } from 'bcryptjs';
import { forwardRef, Inject, Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import { JwtPayload, JwtTokens } from '../interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { jwtConstants } from './constants';
import * as crypto from 'crypto';
import { UserRole } from "@prisma/client";
import { TokenService } from '../services/token.service';
import { TokenType } from '../enums/token-type.enum';
import { ExpirationUnit } from '../enums/expiration-unit.enum';

@Injectable()
export class AuthUtil {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
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
      maxAge: this.tokenService.calcTokenExpiration(TokenType.REFRESH, ExpirationUnit.MS) as number,
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

  // private helpers
  
  buildIncompleteUserRedirect(incompleteUser): string {
    const redirectUrl = new URL('/complete-signup', process.env.FRONTEND_URL);
    redirectUrl.searchParams.set('email', incompleteUser.email);
    redirectUrl.searchParams.set('username', incompleteUser.userName);
    redirectUrl.searchParams.set('name', incompleteUser.name)
    redirectUrl.searchParams.set('picture', incompleteUser.picture || '');
  
    return redirectUrl.toString();
  }
}
