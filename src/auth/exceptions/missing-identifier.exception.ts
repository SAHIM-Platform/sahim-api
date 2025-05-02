import { BadRequestException } from '@nestjs/common';

export class MissingIdentifierException extends BadRequestException {
  constructor(message = 'Username or academic number is required') {
    super(message);
  }
}
