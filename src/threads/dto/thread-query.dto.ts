import { IsOptional, IsIn, IsInt, Min, Max, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SortType } from '../enum/sort-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ThreadQueryDto {
  @ApiProperty({
    description: 'Sort order for threads',
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

  @ApiProperty({
    description: 'Filter threads by category ID',
    minimum: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Search query is too long' })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: 'Search query cannot be empty' })
  search?: string;
}