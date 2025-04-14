import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @Matches(/^https?:\/\/.*\.(jpg|jpeg|png|webp)$/i, {
        message: 'photo_path must be a valid image URL ending in .jpg, .jpeg, .png, or .webp',
    })
    photo_path?: string;
}
