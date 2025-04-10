import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Programming',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Category name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Category name cannot be longer than 50 characters' })
  name: string;
}