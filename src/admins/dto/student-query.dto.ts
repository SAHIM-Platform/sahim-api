import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class StudentQueryDto {
  @ApiProperty({
    description: 'Filter students by approval status',
    enum: ApprovalStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

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
    description: 'Search term (name or academic number)',
    required: false
  })
  @IsOptional()
  @IsString()
  search: string;
}