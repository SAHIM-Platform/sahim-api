import { UnauthorizedException } from '@nestjs/common';

export class UserNotFoundException extends UnauthorizedException {
  constructor(message = 'User not found') {
    super(message);
  }
}
