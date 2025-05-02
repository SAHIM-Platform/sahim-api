import { ConflictException } from '@nestjs/common';

export class UsernameTakenException extends ConflictException {
  constructor() {
    super('Username is already taken');
  }
}
