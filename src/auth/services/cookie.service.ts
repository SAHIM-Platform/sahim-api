import { Injectable, Inject, Res } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { ExpirationUnit } from '../enums/expiration-unit.enum';
import { TokenType } from '../enums/token-type.enum';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

@Injectable()
export class CookieService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

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
      maxAge: this.tokenService.calcTokenExpiration(
        TokenType.REFRESH,
        ExpirationUnit.MS,
      ) as number,
    });
  }

  /**
   * Unset the refresh token cookie in the response.
   * @param res - The Express response object.
   */
  unsetRefreshTokenCookie(@Res() res: Response): void {
    res.clearCookie('refreshToken', this.getCookieOptions());
  }
  
}
