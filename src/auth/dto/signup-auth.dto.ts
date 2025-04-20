import { Department, AuthMethod } from '@prisma/client';
import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  MaxLength,
  IsEnum,
  ValidateIf,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupAuthDto {
  @ApiProperty({
    description: 'Email address (only required for Google OAuth)',
    example: 'user@example.com',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @ValidateIf((o) => o.authMethod === AuthMethod.OAUTH_GOOGLE)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email?: string;

  @ApiProperty({
    description: 'Username (letters, numbers, underscores and hyphens only)',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and hyphens',
  })
  username: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Auth method (omit for email/password)',
    enum: AuthMethod,
    required: false,
    default: AuthMethod.EMAIL_PASSWORD
  })
  @IsEnum(AuthMethod)
  @IsOptional()
  authMethod?: AuthMethod;

  @ApiProperty({
    description: 'Password (required if authMethod is EMAIL_PASSWORD or undefined)',
    required: false
  })
  @ValidateIf(o => !o.authMethod || o.authMethod === AuthMethod.EMAIL_PASSWORD)
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
    },
  )
  password?: string;
}