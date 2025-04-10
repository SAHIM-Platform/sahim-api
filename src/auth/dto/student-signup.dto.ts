import { Department } from '@prisma/client';
import { IsInt, IsEnum, Min, Max, Matches, IsString } from 'class-validator';
import { SignupAuthDto } from './signup-auth.dto';
import { ApiProperty } from '@nestjs/swagger';

export class StudentSignUpDto extends SignupAuthDto {
  @ApiProperty({
    description: 'Academic number (must be exactly 13 digits)',
    example: '1234567890123',
    pattern: '^\\d{13}$',
  })
  @IsString({ message: 'Academic number must be a string' })
  @Matches(/^\d{13}$/, {
    message: 'Academic number must be exactly 13 digits',
  })
  academicNumber: string;

  @ApiProperty({
    description: 'Student department',
    enum: Department,
    example: Department.IT,
  })
  @IsEnum(Department, { message: 'Invalid department selection' })
  department: Department;

  @ApiProperty({
    description: 'Study level (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Study level must be an integer' })
  @Min(1, { message: 'Study level must be at least 1' })
  @Max(5, { message: 'Study level must not exceed 5' })
  studyLevel: number;
}
