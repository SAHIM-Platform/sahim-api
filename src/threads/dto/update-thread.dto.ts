import { 
    IsString, 
    IsOptional, 
    MinLength, 
    MaxLength,
    IsInt,
    Min,
    IsUrl
  } from 'class-validator';
  
  export class UpdateThreadDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    category_id?: number;
  
    @IsString()
    @IsOptional()
    @MinLength(5)
    @MaxLength(200)
    title?: string;
  
    @IsString()
    @IsOptional()
    @MinLength(10)
    @MaxLength(5000)
    content?: string;

    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'Invalid URL format' })
    @MaxLength(500, { message: 'Thumbnail URL cannot be longer than 500 characters' })
    thumbnail_url?: string;
  }