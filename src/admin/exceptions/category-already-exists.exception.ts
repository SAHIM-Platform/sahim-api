import { ConflictException } from '@nestjs/common';

export class CategoryAlreadyExistsException extends ConflictException {
  constructor(name: string) {
    super(`Category with the name "${name}" already exists`);
  }
}
