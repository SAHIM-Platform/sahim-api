export interface JwtPayload {
  sub: number;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: JwtTokens;
}