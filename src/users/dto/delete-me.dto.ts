import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteMeDto {
  @ApiProperty({
    description: 'User current password for confirmation',
    example: 'currentPassword123',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
