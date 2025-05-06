import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message = 'Invalid credentials') {
    super(message);
  }
}
