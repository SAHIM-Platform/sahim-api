import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './utils/constants';
import { AuthUtil } from './utils/auth.util';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        publicKey: jwtConstants.publicKey,
        privateKey: jwtConstants.privateKey,
        signOptions: {
          algorithm: 'RS256',
          expiresIn: jwtConstants.expiration,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthUtil, JwtStrategy],
})
export class AuthModule {}
