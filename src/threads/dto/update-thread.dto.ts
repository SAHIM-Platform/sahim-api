import { 
    IsString, 
    IsOptional, 
    MinLength, 
    MaxLength,
    IsInt,
    Min,
    IsUrl
  } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
  
  export class UpdateThreadDto {
    @ApiProperty({
      description: 'The ID of the category this thread belongs to',
      example: 1,
      minimum: 1,
      required: false
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    category_id?: number;
  
    @ApiProperty({
      description: 'The title of the thread',
      example: 'How to implement authentication in NestJS',
      minLength: 5,
      maxLength: 200,
      required: false
    })
    @IsString()
    @IsOptional()
    @MinLength(5)
    @MaxLength(200)
    title?: string;
  
    @ApiProperty({
      description: 'The main content of the thread',
      example: 'I am trying to implement authentication in my NestJS application...',
      minLength: 10,
      maxLength: 5000,
      required: false
    })
    @IsString()
    @IsOptional()
    @MinLength(10)
    @MaxLength(5000)
    content?: string;

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