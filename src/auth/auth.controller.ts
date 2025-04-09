import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SigninAuthDto } from './dto/signin-auth.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { PrismaService } from 'prisma/prisma.service';
import { Public } from './decorators/public.decorator';
import { StudentSignUpDto } from './dto/student-signup.dto';
import { GoogleAuthGuard } from './guards/google-auth-guard.dto';
import { AuthUtil } from './utils/auth.util';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authUtil: AuthUtil,
  ) { }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new student user' })
  @ApiBody({ type: StudentSignUpDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      example: {
        message: 'User registered successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'student@example.com',
          username: 'student1',
          name: 'Student Name',
          role: 'STUDENT'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  async signup(@Body() input: StudentSignUpDto, @Res() res: Response) {
    const { accessToken, user } = await this.authService.signup(input, res);
    res.json({ message: 'User registered successfully', accessToken, user });
  }

  @Public()
  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({ type: SigninAuthDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Sign in successful',
    schema: {
      example: {
        message: 'Sign in successful',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'user@example.com',
          username: 'username',
          name: 'User Name',
          role: 'STUDENT'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async signin(@Body() input: SigninAuthDto, @Res() res: Response) {
    const { accessToken, user } = await this.authService.signin(input, res);
    res.json({ message: 'Sign in successful', accessToken, user });
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Access token refreshed successfully',
    schema: {
      example: {
        message: 'Access token refreshed successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid refresh token' })
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
  @ApiOperation({ summary: 'Sign out user and invalidate refresh token' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ 
    status: 200, 
    description: 'Sign out successful',
    schema: {
      example: {
        message: 'Sign out successful'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing tokens' })
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
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google login page' })
  handleGoogleLogin() {
    return { msg: 'Google Authentication' };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logged in successfully using Google',
    schema: {
      example: {
        msg: 'Logged in successfully using google',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  async handleGoogleRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;
    const { accessToken, refreshToken } = await this.authUtil.generateJwtTokens(user.id, req);

    this.authUtil.setRefreshTokenCookie(refreshToken, res);

    return res.json({ msg: 'Logged in successfully using google', accessToken: accessToken });
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({ 
    status: 200, 
    description: 'User is authenticated',
    schema: {
      example: {
        msg: 'Authenticated'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  user(@Req() request: any) {
    console.log(request.user);
    return { msg: "Authenticated" };
  }
}

