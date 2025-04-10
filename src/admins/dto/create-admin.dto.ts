import { SignupAuthDto } from "@/auth/dto/signup-auth.dto";
import { UserRole } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class AdminSignupDto extends SignupAuthDto {
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.ADMIN;
  }
  