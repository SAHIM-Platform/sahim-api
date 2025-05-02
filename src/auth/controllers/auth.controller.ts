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
import { AuthService } from '../services/auth.service';
import { SigninAuthDto } from '../dto/signin-auth.dto';
import { Public } from '../decorators/public.decorator';
import { StudentSignUpDto } from '../dto/student-signup.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  SwaggerAuth,
  SwaggerSignup,
  SwaggerSignin,
  SwaggerRefresh,
  SwaggerSignout,
  SwaggerAuthStatus
} from '../decorators/swagger.decorators';
import { GetUser } from '../decorators/get-user.decorator';

@SwaggerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
  async signout(@GetUser('sub') userId, @Req() req, @Res() res: Response) {
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

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @SwaggerAuthStatus()
  user(@Req() request: any) {
    console.log(request.user);
    return { msg: "Authenticated" };
  }
}

