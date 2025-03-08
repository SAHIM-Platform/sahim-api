import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  googleLogin(req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!req.user) {
      return 'No user from google';
    }
    return {
      massage: 'user info from google',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      user: req.user,
    };
  }
}
