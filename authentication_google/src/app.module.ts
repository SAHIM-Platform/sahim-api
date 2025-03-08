import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import googleOauthConfig from './config/google.oauth.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [googleOauthConfig],
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
