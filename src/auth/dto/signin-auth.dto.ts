import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SigninAuthDto {
  @ApiProperty({
    description: 'Username or academic number for authentication',
    example: 'username or 1234567890123',
  })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}