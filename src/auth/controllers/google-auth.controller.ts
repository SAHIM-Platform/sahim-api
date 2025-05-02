import { Controller, Get, HttpStatus, Req, Res, UseGuards } from "@nestjs/common";
import { Public } from "../decorators/public.decorator";
import { SwaggerGoogleLogin } from "../decorators/swagger.decorators";
import { GoogleAuthGuard } from "../guards/google-auth-guard.dto";
import { AuthService } from "../services/auth.service";
import { CookieService } from "../services/cookie.service";
import { TokenService } from "../services/token.service";
import { AuthUtil } from "../utils/auth.helpers";
import { Response } from "express";
import { GoogleAuthService } from "../services/google-auth.service";

@Controller('auth/google')
export class GoogleAuthController {
    constructor(
      private readonly authService: AuthService,
      private readonly tokenService: TokenService,
      private readonly cookieService: CookieService,
      private readonly googleAuthService: GoogleAuthService,
    ) {}


    @Public()
    @Get('login')
    @UseGuards(GoogleAuthGuard)
    @SwaggerGoogleLogin()
    handleGoogleLogin() {
      return { msg: 'Google Authentication' };
    }
  
    @Public()
    @Get('callback')
    @UseGuards(GoogleAuthGuard)
    async handleGoogleRedirect(@Req() req, @Res() res: Response) {
      const { googleUser } = req.user;
    
      try {
        const validatedUser = await this.authService.googleLogin(googleUser);
    
        // Fully registered user – generate tokens
        const { accessToken, refreshToken } = await this.tokenService.generateJwtTokens(validatedUser.id, req);
    
        this.cookieService.setRefreshTokenCookie(refreshToken, res);
    
        return res.redirect(`${process.env.FRONTEND_URL}`);
      } catch (error) {
        return this.googleAuthService.handleOAuthError(error, res);
      }
    }

}