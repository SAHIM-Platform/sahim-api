import { IsInt, Min } from 'class-validator';

export class BookmarkThreadDto {
  @IsInt()
  @Min(1, { message: 'Thread ID must be a positive integer' })
  thread_id: number;
}