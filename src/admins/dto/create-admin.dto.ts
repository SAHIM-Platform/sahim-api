import { SignupAuthDto } from "@/auth/dto/signup-auth.dto";
import { UserRole } from "@prisma/client";
import { IsEnum, IsOptional, IsString, Matches, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AdminSignupDto extends SignupAuthDto {
    @ApiProperty({
        description: 'Admin role (defaults to ADMIN)',
        enum: UserRole,
        default: UserRole.ADMIN,
        required: false
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.ADMIN;

    // Override to make password ALWAYS required for admin creation
    @ApiProperty({
        description: 'Password (must contain uppercase, lowercase, number and special character)',
        example: 'AdminPass123!',
        minLength: 8
    })
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character',
    })
    password: string;
  }
  