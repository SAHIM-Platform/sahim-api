import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookmarkThreadDto {
  @ApiProperty({
    description: 'The ID of the thread to bookmark',
    example: 1,
    minimum: 1
  })
  @IsInt()
  @Min(1, { message: 'Thread ID must be a positive integer' })
  thread_id: number;
}