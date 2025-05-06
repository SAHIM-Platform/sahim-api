import { ForbiddenException } from '@nestjs/common';

export class SuperAdminModificationForbiddenException extends ForbiddenException {
  constructor() {
    super('Super admin profile cannot be modified or deleted.');
  }
}
