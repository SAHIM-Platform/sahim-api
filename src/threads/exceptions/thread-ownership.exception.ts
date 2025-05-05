import { ForbiddenException } from '@nestjs/common';

export class ThreadOwnershipException extends ForbiddenException {
  constructor(action: 'update' | 'delete') {
    super(`You do not have permission to ${action} this thread`);
  }
}
