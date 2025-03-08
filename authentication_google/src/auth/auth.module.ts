import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [ConfigModule],
  providers: [GoogleStrategy],
})
export class AuthModule {}
