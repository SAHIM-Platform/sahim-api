import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './utils/constants';
import { AuthUtil } from './utils/auth.util';
import { JwtStrategy } from './strategies/jwt.strategy';
import googleOauthConfig from './config/google.oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigModule } from '@nestjs/config';

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
  controllers: [AuthController],
  providers: [AuthService, AuthUtil, JwtStrategy,GoogleStrategy],
})
export class AuthModule {}
