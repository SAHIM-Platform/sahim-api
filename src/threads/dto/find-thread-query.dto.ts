// find-one-thread-query.dto.ts
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindOneThreadQueryDto {
  @ApiProperty({
    description: 'Whether to include comments in the response',
    default: true,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeComments?: boolean = true;

  @ApiProperty({
    description: 'Page number for comments pagination',
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commentsPage?: number = 1;

  @ApiProperty({
    description: 'Number of comments per page',
    default: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commentsLimit?: number = 10;

  @ApiProperty({
    description: 'Whether to include vote information in the response',
    default: true,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeVotes?: boolean = true;
}