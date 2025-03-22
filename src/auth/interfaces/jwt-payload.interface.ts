import { UserRole } from "@prisma/client";

export interface JwtPayload {
  sub: number;
  role: UserRole;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
}