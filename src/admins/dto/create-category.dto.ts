import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name. Letters, numbers, spaces, dots, hyphens. Must include ≥2 letters. No leading number/dot or trailing hyphen.',
    example: 'Programming',
    minLength: 2,
    maxLength: 50,
    pattern: '^(?=.{2,50}$)(?![0-9\\.])(?!-)(?!.*--)(?=.*[A-Za-z].*[A-Za-z])[A-Za-z0-9 .-]+(?<!-)$'
  })
  @IsString({ message: 'Category name must be a string.' })
  @IsNotEmpty({ message: 'Category name cannot be empty.' })
  @MinLength(2, { message: 'Category name must be at least $constraint1 characters long.' })
  @MaxLength(50, { message: 'Category name cannot be longer than $constraint1 characters.' })
  @Matches(/^(?=.{2,50}$)(?![0-9\.])(?!-)(?!.*--)(?=.*[A-Za-z].*[A-Za-z])[A-Za-z0-9 .-]+(?<!-)$/, {
    message: [
      'Allowed chars: letters, numbers, spaces, dots (.), hyphens (-).',
      'Must include at least two letters.',
      'Cannot start with a digit or dot.',
      'Cannot start or end with a hyphen.',
      'Cannot contain consecutive hyphens.',
    ].join(' '),
  })
  name: string;
}