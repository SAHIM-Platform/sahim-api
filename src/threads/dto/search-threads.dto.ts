import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchThreadsDto {
  @IsString()
  @MaxLength(100, { message: 'Query is too long' })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: 'Query cannot be empty' }) 
  query: string;
}
