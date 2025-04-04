import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when a category is not found.
 */
export class CategoryNotFoundException extends HttpException {
  constructor(categoryId: number) {
    super(
      {
        message: `Category with ID ${categoryId} not found`,
        error: 'Not Found',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
} 