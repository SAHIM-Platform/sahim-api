import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Get,
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
    const { tokens } = await this.authService.signup(input, res);
    res.json({ message: 'User registered successfully', tokens });
  }

  @Post('signin')
  async signin(@Body() input: SigninAuthDto, @Res() res: Response) {
    const { tokens } = await this.authService.signin(input, res);
    res.json({ message: 'Sign in successful', tokens });
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string, @Res() res: Response) {
    const { accessToken } = await this.authService.refreshAccessToken(refreshToken);
    res.json({ message: 'Access token refreshed successfully', accessToken });
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signout(
    @Request() req,
    @Body('refreshToken') refreshToken: string,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    await this.authService.signout(refreshToken, userId, res);
    res.json({ message: 'Sign out successful' });
  }

  // ⚠️ Only for debugging purposes, I am going to remove it later.
  @UseGuards(JwtAuthGuard)
  @Get('debug/tokens')
  async getRefreshTokens(@Request() req) {
    const { userId } = req.user;
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return tokens;
  }
}
