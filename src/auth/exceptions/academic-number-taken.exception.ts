import { BadRequestException } from '@nestjs/common';

export class AcademicNumberTakenException extends BadRequestException {
  constructor(message = 'Academic number already registered') {
    super(message);
  }
}
