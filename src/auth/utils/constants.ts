import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

const keyPath = join(process.cwd(), 'storage', 'keys');

function loadKey(fileName: string): string {
  const filePath = join(keyPath, fileName);
  if (!existsSync(filePath)) {
    console.warn(`Warning: Key file missing - ${filePath}`);
    return '';
  }
  return readFileSync(filePath, 'utf-8');
}

export const jwtConstants = {
  publicKey: loadKey('jwt.public.key'),
  privateKey: loadKey('jwt.private.key'),
  secretKey: loadKey('jwt.secret.key'),
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  algorithm: 'PS256' as const,
};
