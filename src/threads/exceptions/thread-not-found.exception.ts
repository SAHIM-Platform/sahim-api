import { NotFoundException } from '@nestjs/common';

export class ThreadNotFoundException extends NotFoundException {
  constructor(threadId: number) {
    super(`Thread with ID ${threadId} not found`);
  }
}
