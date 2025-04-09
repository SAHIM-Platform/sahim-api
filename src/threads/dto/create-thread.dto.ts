import { 
    IsNumber, 
    IsString, 
    IsNotEmpty, 
    MinLength, 
    MaxLength,
    IsInt,
    Min,
    IsOptional,
    IsUrl
  } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
  
  export class CreateThreadDto {
    @ApiProperty({
      description: 'The ID of the category this thread belongs to',
      example: 1,
      minimum: 1
    })
    @IsInt()
    @Min(1, { message: 'Category ID must be a positive integer' })
    category_id: number;
  
    @ApiProperty({
      description: 'The title of the thread',
      example: 'How to implement authentication in NestJS',
      minLength: 5,
      maxLength: 200
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(5, { message: 'Title must be at least 5 characters long' })
    @MaxLength(200, { message: 'Title cannot be longer than 200 characters' })
    title: string;
  
    @ApiProperty({
      description: 'The main content of the thread',
      example: 'I am trying to implement authentication in my NestJS application...',
      minLength: 10,
      maxLength: 5000
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(10, { message: 'Content must be at least 10 characters long' })
    @MaxLength(5000, { message: 'Content cannot be longer than 5000 characters' })
    content: string;

    @ApiProperty({
      description: 'Optional URL to a thumbnail image for the thread',
      example: 'https://example.com/images/thumbnail.jpg',
      maxLength: 500,
      required: false
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'Invalid URL format' })
    @MaxLength(500, { message: 'Thumbnail URL cannot be longer than 500 characters' })
    thumbnail_url?: string;
  }