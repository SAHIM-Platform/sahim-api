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
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
    user: {
      id: number;
      name: string;
      username?: string;
      role: string;
      photoPath?: string;
    };
  };
}