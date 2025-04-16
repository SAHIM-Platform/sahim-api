import { IsString, MinLength, MaxLength, Matches, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({
    description: 'New username (letters, numbers, underscores and hyphens only)',
    example: 'newusername',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and hyphens',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'New full name',
    example: 'Jane Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Profile photo URL (must be a valid image URL)',
    example: 'https://example.com/photo.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @Matches(/\.(jpg|jpeg|png|webp)$/i, {
    message: 'URL must end with .jpg, .jpeg, .png, or .webp',
  })
  photoPath?: string;
}
