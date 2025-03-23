import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SigninAuthDto } from './dto/signin-auth.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';

import { PrismaService } from 'prisma/prisma.service';
import { Public } from './decorators/public.decorator';
import { studentSignUpDto } from './dto/student-signup.dto';
import { GoogleAuthGuard } from './guards/google-auth-guard.dto';
import { AuthUtil } from './utils/auth.util';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authUtil: AuthUtil,
  ) {}

  @Public()
  @Post('signup')
  async signup(@Body() input: studentSignUpDto, @Res() res: Response) {
    const { accessToken } = await this.authService.signup(input, res);
    res.json({ message: 'User registered successfully', accessToken });
  }

  @Public()
  @Post('signin')
  async signin(@Body() input: SigninAuthDto, @Res() res: Response) {
    const { accessToken } = await this.authService.signin(input, res);
    res.json({ message: 'Sign in successful', accessToken });
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }
    const { accessToken } = await this.authService.refreshToken(
      refreshToken,
      res,
    );
    res.json({ message: 'Access token refreshed successfully', accessToken });
  }

  @Post('signout')
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

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {
    return { msg: 'Google Authentication' };
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;
    const { accessToken, refreshToken } = await this.authUtil.generateJwtTokens(user.id, req);

    this.authUtil.setRefreshTokenCookie(refreshToken, res);

    return res.json({ msg: 'Logged in successfully using google', accessToken: accessToken });
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  user(@Req() request: any) {
    console.log(request.user);
    return { msg: "Authenticated"};
  }

}

