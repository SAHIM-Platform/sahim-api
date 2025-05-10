import { NotFoundException } from '@nestjs/common';

export class CommentNotFoundException extends NotFoundException {
  constructor(commentId: number) {
    super(`Comment with ID ${commentId} not found`);
  }
}
