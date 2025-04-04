// find-one-thread-query.dto.ts
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';

export class FindOneThreadQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeComments?: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commentsPage?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commentsLimit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeVotes?: boolean = true;
}