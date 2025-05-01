import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './services/auth.service';
import { SigninAuthDto } from './dto/signin-auth.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from 'prisma/prisma.service';
import { Public } from './decorators/public.decorator';
import { StudentSignUpDto } from './dto/student-signup.dto';
import { GoogleAuthGuard } from './guards/google-auth-guard.dto';
import { AuthUtil } from './utils/auth.helpers';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  SwaggerAuth,
  SwaggerSignup,
  SwaggerSignin,
  SwaggerRefresh,
  SwaggerSignout,
  SwaggerGoogleLogin,
  SwaggerGoogleCallback,
  SwaggerAuthStatus
} from './decorators/swagger.decorators';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenService } from './services/token.service';

@SwaggerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authUtil: AuthUtil,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenService: TokenService,
  ) { }

  @Public()
  @Post('signup')
  @SwaggerSignup()
  async signup(@Body() input: StudentSignUpDto, @Res() res: Response) {
    console.log("Inside signup: ", input);
    const { accessToken, user } = await this.authService.signup(input, res);
    res.json({ message: 'User registered successfully', accessToken, user });
  }

  @Public()
  @Post('signin')
  @SwaggerSignin()
  async signin(@Body() input: SigninAuthDto, @Res() res: Response) {
    const { accessToken, user } = await this.authService.signin(input, res);
    res.json({ message: 'Sign in successful', accessToken, user });
  }

  @Public()
  @Post('refresh')
  @SwaggerRefresh()
  async refreshToken(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }
    const { accessToken, user } = await this.authService.refreshToken(
      refreshToken,
      res,
    );
    res.json({ message: 'Access token refreshed successfully', accessToken, user });
  }

  @Post('signout')
  @SwaggerSignout()
  async signout(@Req() req, @Res() res: Response) {
    const userId = req.user?.sub;
    const refreshToken = req.cookies?.refreshToken;
    if (userId === undefined) {
      throw new UnauthorizedException(
        'User ID is undefined. This might be due to incorrect JWT payload structure or authentication issues.',
      );
    }
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }
    await this.authService.signout(refreshToken, userId, res);
    res.json({ message: 'Sign out successful' });
  }

  @Public()
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  @SwaggerGoogleLogin()
  handleGoogleLogin() {
    return { msg: 'Google Authentication' };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleRedirect(@Req() req, @Res() res: Response) {
    const { googleUser } = req.user;
  
    try {
      const validatedUser = await this.authService.validateGoogleUser(googleUser);
  
      // Fully registered user – generate tokens
      const { accessToken, refreshToken } = await this.tokenService.generateJwtTokens(validatedUser.id, req);
  
      this.authUtil.setRefreshTokenCookie(refreshToken, res);
  
      return res.redirect(`${process.env.FRONTEND_URL}`);
    } catch (error) {
      if (error?.status === HttpStatus.PRECONDITION_REQUIRED) {
        const incompleteUserData = error?.response?.incompleteUser;
        console.log('Redirecting incomplete user:', incompleteUserData);
        const redirectUrl = this.authUtil.buildIncompleteUserRedirect(incompleteUserData);
        return res.redirect(redirectUrl);      
      }
  
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred during Google login', });
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @SwaggerAuthStatus()
  user(@Req() request: any) {
    console.log(request.user);
    return { msg: "Authenticated" };
  }
}

