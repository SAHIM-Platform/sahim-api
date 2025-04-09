import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchThreadsDto {
  @ApiProperty({
    description: 'Search query to find threads by title or content',
    example: 'authentication',
    maxLength: 100
  })
  @IsString()
  @MaxLength(100, { message: 'Query is too long' })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: 'Query cannot be empty' }) 
  query: string;
}
