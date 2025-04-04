import { IsNotEmpty, IsEnum } from 'class-validator';
import { VoteType } from '@prisma/client';

export class VoteDto {
  @IsNotEmpty()
  @IsEnum(VoteType, { 
    message: 'Vote type must be either UP or DOWN' 
  })
  vote_type: VoteType;
}