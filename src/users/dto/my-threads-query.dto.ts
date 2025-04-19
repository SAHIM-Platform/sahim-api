import { ThreadQueryDto } from '@/threads/dto/thread-query.dto';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class MyThreadsQueryDto extends ThreadQueryDto{
  
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Search query is too long' })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: 'Search query cannot be empty' })
  search?: string;
}