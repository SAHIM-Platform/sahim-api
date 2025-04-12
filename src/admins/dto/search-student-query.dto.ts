import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class StudentSearchQueryDto {
  @ApiProperty({
    description: 'Search query (name or academic number)',
    required: true
  })
  @IsString()
  query: string;

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