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
  
  export class CreateThreadDto {
    @IsInt()
    @Min(1, { message: 'Category ID must be a positive integer' })
    category_id: number;
  
    @IsString()
    @IsNotEmpty()
    @MinLength(5, { message: 'Title must be at least 5 characters long' })
    @MaxLength(200, { message: 'Title cannot be longer than 200 characters' })
    title: string;
  
    @IsString()
    @IsNotEmpty()
    @MinLength(10, { message: 'Content must be at least 10 characters long' })
    @MaxLength(5000, { message: 'Content cannot be longer than 5000 characters' })
    content: string;

    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'Invalid URL format' })
    @MaxLength(500, { message: 'Thumbnail URL cannot be longer than 500 characters' })
    thumbnail_url?: string;
  }