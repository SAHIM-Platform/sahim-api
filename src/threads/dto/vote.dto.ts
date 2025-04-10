import { IsNotEmpty, IsEnum } from 'class-validator';
import { VoteType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class VoteDto {
  @ApiProperty({
    description: 'The type of vote (UP or DOWN)',
    enum: VoteType,
    example: VoteType.UP
  })
  @IsNotEmpty()
  @IsEnum(VoteType, { 
    message: 'Vote type must be either UP or DOWN' 
  })
  vote_type: VoteType;
}