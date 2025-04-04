import { 
    IsString, 
    IsNotEmpty, 
    MinLength, 
    MaxLength
  } from 'class-validator';
  
  export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: 'Content cannot be empty' })
    @MaxLength(2000, { message: 'Content cannot exceed 2000 characters' })
    content: string;
  }