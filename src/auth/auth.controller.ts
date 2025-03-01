import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SigninAuthDto } from './dto/signin-auth.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from 'prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('signup')
  async signup(@Body() input: SignupAuthDto, @Res() res: Response) {
    const { accessToken } = await this.authService.signup(input, res);
    res.json({ message: 'User registered successfully', accessToken });
  }

  @Post('signin')
  async signin(@Body() input: SigninAuthDto, @Res() res: Response) {
    const { accessToken } = await this.authService.signin(input, res);
    res.json({ message: 'Sign in successful', accessToken });
  }

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

  @UseGuards(JwtAuthGuard)
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
}
