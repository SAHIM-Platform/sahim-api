import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { jwtConstants } from '../utils/constants';
import { UserService } from '@/users/services/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.publicKey,
      algorithms: [jwtConstants.algorithm],
    });
  }

  /**
   * Validates the JWT payload and retrieves the user.
   * @param payload - The decoded JWT payload.
   * @returns The validated user information.
   * @throws UnauthorizedException if the token is invalid or the user is not found.
   */
  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tokenType || payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid or missing token type');
    }

    const user = await this.userService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      sub: payload.sub,
      role: user.role,
      tokenType: payload.tokenType,
    };
  }
}
