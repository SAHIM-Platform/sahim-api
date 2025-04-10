import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SortType } from '@/threads/enum/sort-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class BookmarksQueryDto {
  @ApiProperty({
    description: 'Sort order for bookmarked threads',
    enum: SortType,
    default: SortType.LATEST,
    required: false
  })
  @IsOptional()
  @IsIn(Object.values(SortType))
  sort?: SortType = SortType.LATEST;

  @ApiProperty({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 50,
    default: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
} 