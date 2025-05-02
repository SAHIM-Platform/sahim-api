import { hash as bHash } from 'bcryptjs';
import { Injectable,  } from '@nestjs/common';
import { jwtConstants } from './constants';
import * as crypto from 'crypto';

@Injectable()
export class AuthUtil {
  constructor(
  ) {}

  /**
   * Hashes a password using bcrypt.
   * @param password - The password to hash.
   * @returns A promise that resolves to the hashed password.
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bHash(password, saltRounds);
  }

  /**
   * Hashes a token using SHA-256 and a secret key.
   * @param token - The token to be hashed.
   * @returns The hashed token as a hexadecimal string.
   */
  hashToken(token: string): string {
    return crypto
      .createHmac('sha256', jwtConstants.secretKey)
      .update(token)
      .digest('hex');
  }

  // private helpers
  
  buildIncompleteUserRedirect(incompleteUser): string {
    const redirectUrl = new URL('/complete-signup', process.env.FRONTEND_URL);
    redirectUrl.searchParams.set('email', incompleteUser.email);
    redirectUrl.searchParams.set('username', incompleteUser.userName);
    redirectUrl.searchParams.set('name', incompleteUser.name)
    redirectUrl.searchParams.set('picture', incompleteUser.picture || '');
  
    return redirectUrl.toString();
  }
}
