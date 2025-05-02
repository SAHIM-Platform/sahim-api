import { HttpException, HttpStatus } from '@nestjs/common';
import { GoogleUser } from '../interfaces/google-user.interface';
import { UsersService } from '@/users/users.service';
import { Response } from 'express';
import { AuthUtil } from '../utils/auth.helpers';

export class GoogleAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authUtil: AuthUtil, 
  ) {}

  /**
   * Validates a Google user and returns the existing user if found.
   * If the user does not exist, throws an exception with incomplete user data for registration.
   * @param googleUser - The Google user object containing name and email.
   * @throws {HttpException} If the Google user information is incomplete or the user is not registered.
   * @returns {Promise<any>} The authenticated user if they already exist.
   */
  async validateGoogleUser(googleUser: GoogleUser) {
    const { name, email } = googleUser;

    if (!email || !name) {
      throw new HttpException(
        'Google user information is incomplete',
        HttpStatus.BAD_REQUEST,
      );
    }

    let user = await this.usersService.findUserByEmail(email);

    if (!user) {
      const { defaultUsername } =
        await this.generateDefaultUsername(googleUser);

      const incompleteUser = { ...googleUser, userName: defaultUsername };

      throw new HttpException(
        {
          status: 'incomplete',
          message:
            'User not fully registered. Please complete your information.',
          incompleteUser: incompleteUser,
        },
        HttpStatus.PRECONDITION_REQUIRED, // 428: Means additional steps are required
      );
    }

    return user;
  }

  /**
   * Generates a unique username based on the Google user's name.
   * Ensures the username does not conflict with existing usernames.
   * @param googleUser - The Google user object containing the user's name.
   * @returns {Promise<{ defaultUsername: string }>} The generated unique username.
   */
  private async generateDefaultUsername(googleUser: GoogleUser) {
    let defaultUsername = googleUser.name.replace(/\s+/g, '_').toLowerCase();

    // Check if the generated username already exists
    let existingUser =
      await this.usersService.findUserByUsername(defaultUsername);

    // If the username exists, append a number to make it unique
    let counter = 1;
    while (existingUser) {
      defaultUsername = `${googleUser.name.replace(/\s+/g, '_').toLowerCase()}_${counter}`;
      existingUser =
        await this.usersService.findUserByUsername(defaultUsername);
      counter++;
    }

    return { defaultUsername };
  }

  async handleOAuthError(error: any, res: Response) {
    if (error?.status === HttpStatus.PRECONDITION_REQUIRED) {
      const redirectUrl = this.authUtil.buildIncompleteUserRedirect(error?.response?.incompleteUser);
      return res.redirect(redirectUrl);
    }
  
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'An error occurred during Google login',
    });
  }
  
}
