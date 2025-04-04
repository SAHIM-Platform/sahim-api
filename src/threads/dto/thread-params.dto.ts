import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ThreadParamsDto {
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class CommentParamsDto extends ThreadParamsDto {
  @IsInt()
  @Type(() => Number)
  commentId: number;
}
