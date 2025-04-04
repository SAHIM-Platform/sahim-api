import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Category name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Category name cannot be longer than 50 characters' })
  name: string;
}