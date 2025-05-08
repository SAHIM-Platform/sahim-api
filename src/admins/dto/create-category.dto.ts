import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Programming',
    minLength: 2,
    maxLength: 50,
    pattern: '^(?=.*[A-Za-z\u0600-\u06FF])[A-Za-z\u0600-\u06FF ]+$'
  })
  @IsString({ message: 'Category name must be a string.' })
  @IsNotEmpty({ message: 'Category name cannot be empty.' })
  @MinLength(2, { message: 'Category name must be at least $constraint1 characters long.' })
  @MaxLength(50, { message: 'Category name cannot be longer than $constraint1 characters.' })
  @Matches(/^(?=.*[A-Za-z\u0600-\u06FF])[A-Za-z\u0600-\u06FF ]+$/, {
    message:
      'Category name must contain at least one letter (English or Arabic) and only letters and spaces.',
  })
  @Transform(({ value }) =>
    sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim()
  )
  name: string;
}