import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import * as crypto from 'crypto';

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
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
};
