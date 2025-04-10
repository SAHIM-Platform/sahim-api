import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ThreadParamsDto {
  @ApiProperty({
    description: 'The ID of the thread',
    example: 1
  })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class CommentParamsDto extends ThreadParamsDto {
  @ApiProperty({
    description: 'The ID of the comment',
    example: 1
  })
  @IsInt()
  @Type(() => Number)
  commentId: number;
}
