import { 
    IsString, 
    IsOptional, 
    MinLength, 
    MaxLength 
  } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
  
  export class UpdateCommentDto {
    @ApiProperty({
      description: 'The content of the comment',
      example: 'This is an updated comment',
      minLength: 1,
      maxLength: 2000,
      required: false
    })
    @IsString()
    @IsOptional()
    @MinLength(1)
    @MaxLength(2000)
    content?: string;
  }