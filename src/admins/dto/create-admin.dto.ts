import { SignupAuthDto } from "@/auth/dto/signup-auth.dto";
import { UserRole } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
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
  }
  