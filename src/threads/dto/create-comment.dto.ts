import { 
    IsString, 
    IsNotEmpty, 
    MinLength, 
    MaxLength
  } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
  
  export class CreateCommentDto {
    @ApiProperty({
      description: 'The content of the comment',
      example: 'This is a helpful comment about the thread',
      minLength: 1,
      maxLength: 2000
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: 'Content cannot be empty' })
    @MaxLength(2000, { message: 'Content cannot exceed 2000 characters' })
    content: string;
  }