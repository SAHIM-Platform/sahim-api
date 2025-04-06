import { Department } from '@prisma/client';
import { IsInt, IsEnum, Min, Max } from 'class-validator';
import { SignupAuthDto } from './signup-auth.dto';


export class StudentSignUpDto extends SignupAuthDto {
  @IsString({ message: 'Academic number must be a string' })
  @Matches(/^\d{13}$/, {
    message: 'Academic number must be exactly 13 digits',
  })
  academicNumber: string;


  @IsEnum(Department, { message: 'Invalid department selection' })
  department: Department;

  @IsInt({ message: 'Study level must be an integer' })
  @Min(1, { message: 'Study level must be at least 1' })
  @Max(5, { message: 'Study level must not exceed 5' })
  studyLevel: number;
}
