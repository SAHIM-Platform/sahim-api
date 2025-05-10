import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ThreadQueryDto } from '@/threads/dto/thread-query.dto';

export class ProfileQueryDto extends ThreadQueryDto { 
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeThreads?: boolean;
}
