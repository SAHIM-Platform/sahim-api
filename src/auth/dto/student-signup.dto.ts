import { Department } from '@prisma/client';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    IsInt,
    Min,
    Max,
    IsEnum,
    Matches,
} from 'class-validator';

export class StudentSignupDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @MaxLength(255, { message: 'Email must not exceed 255 characters' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(72, { message: 'Password must not exceed 72 characters' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,72}$/, {
        message:
            'Password must contain at least one letter, one number, and be 8-72 characters long',
    })
    password: string;

    @IsString()
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name: string;

    @IsInt({ message: 'Academic number must be an integer' })
    academicNumber: number;

    @IsEnum(Department, { message: 'Invalid department selection' })
    department: Department;

    @IsInt({ message: 'Study level must be an integer' })
    @Min(1, { message: 'Study level must be at least 1' })
    @Max(5, { message: 'Study level must not exceed 5' })
    studyLevel: number;
}
