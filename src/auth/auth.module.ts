import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '@/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './utils/constants';
import { AuthUtil } from './utils/auth.helpers';
import { JwtStrategy } from './strategies/jwt.strategy';
import googleOauthConfig from './config/google.oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigModule } from '@nestjs/config';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenService } from './services/token.service';
import { GoogleAuthService } from './services/google-auth.service';
import { CookieService } from './services/cookie.service';
import { GoogleAuthController } from './controllers/google-auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule.forFeature(googleOauthConfig),
    JwtModule.registerAsync({
      useFactory: () => ({
        publicKey: jwtConstants.publicKey,
        privateKey: jwtConstants.privateKey,
        signOptions: {
          algorithm: jwtConstants.algorithm,
          expiresIn: jwtConstants.expiration,
        },
      }),
    }),
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [AuthService, AuthUtil, JwtStrategy, GoogleStrategy, TokenService, RefreshTokenService, GoogleAuthService, CookieService],
  exports: [AuthUtil],
})
export class AuthModule {}
