import { UnauthorizedException } from '@nestjs/common';

export class DeletedUserException extends UnauthorizedException {
  constructor(userId?: string) {
    super(
      `User account is inactive or improperly configured. Please contact support or try signing in again.` +
        (userId ? ` [userId: ${userId}]` : ''),
    );
  }
}
