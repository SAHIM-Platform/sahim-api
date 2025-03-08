import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';

import { AuthGuard } from '@nestjs/passport';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async gooleAuth(@Req() req) {
    
  }
  @Get('auth/google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req){
    return this.appService.googleLogin(req)
  }
}
