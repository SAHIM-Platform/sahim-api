import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/users/users.service';
import { compare as bCompare } from 'bcryptjs';
import { SigninAuthDto } from '@/auth/dto/signin-auth.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { PrismaService } from 'prisma/prisma.service';
import { JwtPayload, AuthResponse } from './interfaces/jwt-payload.interface';
import { AuthUtil } from './utils/auth.util';
import { Response } from 'express';
import { ApprovalStatus, UserRole } from '@prisma/client';
import { StudentSignUpDto } from './dto/student-signup.dto';
import { GoogleUser } from './interfaces/google-user.interface';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authUtil: AuthUtil,
  ) { }


  /**
   * Registers a new user with the provided information.
   * @param input - The user's signup information.
   * @param res - The Express response object (used for setting cookies).
   * @throws {BadRequestException} If a user with the given email or username already exists.
   * @returns {Promise<AuthResponse>} Authentication response with tokens.
   */
  async signup(
    input: StudentSignUpDto,
    @Res() res: Response,
  ): Promise<AuthResponse> {
    const { email, username, name, password, academicNumber, department, studyLevel } = input;

    const existingUser = await this.usersService.findUserByEmailOrUsername(
      email,
      username,
    );

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new BadRequestException('Username already taken');
      }
    }

    const existingStudent = await this.prisma.student.findUnique({
      where: { academicNumber },
    });

    if (existingStudent) {
      // If academic number is already taken
      throw new BadRequestException('Academic number already registered');
    }

    const hashedPassword = await this.authUtil.hashPassword(password);

    const createdUser = await this.prisma.user.create({
      data: {
        email,
        username,
        name: name,
        password: hashedPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            academicNumber,
            department,
            studyLevel,
            approvalStatus: ApprovalStatus.PENDING
          }
        }
      },
    });

    const tokens = await this.authUtil.generateJwtTokens(
      createdUser.id,
      res.req,
    );
    this.authUtil.setRefreshTokenCookie(tokens.refreshToken, res);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        username: createdUser.username,
        role: createdUser.role,
      }
    };
  }

  /**
   * Authenticates a user and generates new tokens.
   * @param input - The user's signin information.
   * @param res - The Express response object (used for setting cookies).
   * @throws {NotFoundException} If the user is not found.
   * @throws {UnauthorizedException} If the password is incorrect.
   * @returns {Promise<AuthResponse>} Authentication response with tokens.
   */
  async signin(
    input: SigninAuthDto,
    @Res() res: Response,
  ): Promise<AuthResponse> {
    const { email, password } = input;

    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(
        'User not found. Please check your email or sign up.',
      );
    }

    const passwordMatch = await bCompare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    await this.authUtil.revokeAllRefreshTokens(user.id);

    const tokens = await this.authUtil.generateJwtTokens(user.id, res.req);
    this.authUtil.setRefreshTokenCookie(tokens.refreshToken, res);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    };
  }

  /**
   * Signs out a user by revoking their refresh tokens.
   * @param refreshToken - The refresh token to be revoked.
   * @param userId - The ID of the user signing out.
   * @param res - The Express response object (used for unsetting cookies).
   * @throws {UnauthorizedException} If the refresh token is invalid.
   * @returns {Promise<void>}
   */
  async signout(
    refreshToken: string,
    userId: number,
    @Res() res: Response,
  ): Promise<void> {
    const isValid = await this.authUtil.validateRefreshToken(
      refreshToken,
      userId,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.authUtil.revokeAllRefreshTokens(userId);
    this.authUtil.unsetRefreshTokenCookie(res);
  }

  /**
   * Refreshes the access token and generates a new refresh token as part of the refresh token rotation process.
   * @param oldRefreshToken - The refresh token to be used for generating a new access token and refresh token.
   * @param res - The response object used to set the new refresh token in a cookie.
   *
   * @throws {UnauthorizedException} If the refresh token is invalid, expired, or mismatched.
   * @returns {Promise<AuthResponse>} Authentication response containing the new access token and user details.
   */
  async refreshToken(
    oldRefreshToken: string,
    @Res() res: Response,
  ): Promise<AuthResponse> {
    const encryptedToken = this.authUtil.hashToken(oldRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: encryptedToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (this.authUtil.isTokenExpired(storedToken.expiresAt)) {
      await this.authUtil.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const payload = this.jwtService.verify<JwtPayload>(oldRefreshToken);
    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.sub !== storedToken.userId) {
      // revoke all tokens for this user for security purposes
      await this.authUtil.revokeAllRefreshTokens(storedToken.userId);
      throw new UnauthorizedException('Invalid token');
    }

    // Revoke the used refresh token to prevent reuse
    await this.authUtil.revokeRefreshToken(storedToken.id);

    // Generate new JWT tokens (access and refresh tokens)
    const tokens = await this.authUtil.generateJwtTokens(
      storedToken.userId,
      res.req,
    );

    this.authUtil.setRefreshTokenCookie(tokens.refreshToken, res);

    this.authUtil.cleanupExpiredTokens().catch(console.error);

    return { 
      accessToken: tokens.accessToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        username: storedToken.user.username,
        role: storedToken.user.role,
      }, 
    };
  }

  /**
   * Validates a user for authentication.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns {Promise<any>} The sanitized user object if validation is successful, null otherwise.
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) return null;

    const passwordMatch = await bCompare(password, user.password);
    if (!passwordMatch) return null;

    return this.usersService.sanitizeUser(user);
  }

  /**
   * Validates a Google user and registers them if they do not exist.
   * @param googleUser - The Google user object containing name and email.
   * @throws {Error} If the Google user information is incomplete.
   * @returns {Promise<any>} The authenticated or newly created user.
   */
  async validateGoogleUser(googleUser: GoogleUser) {
    const { name, email } = googleUser;

    if (!email || !name) {
      throw new HttpException('Google user information is incomplete', HttpStatus.BAD_REQUEST);
    }

    let user = await this.usersService.findUserByEmail(email);

    if (!user) {
      const { defaultUsername, defaultPassword } = await this.generateDefaultUsernameAndPassword(googleUser);

      const incompleteUser = { ...googleUser, userName: defaultUsername, password: defaultPassword }

      throw new HttpException(
        {
          status: 'incomplete',
          message: 'User not fully registered. Please complete your information.',
          incompleteUser: incompleteUser,
        },
        HttpStatus.PRECONDITION_REQUIRED // 428: Means additional steps are required
      );

    }

    return user;
  }

  /**
   * Generates a unique username based on the Google user's name and a secure random password.
   * @param googleUser - The Google user object containing the user's name.
   * @returns {Promise<{ defaultUsername: string, defaultPassword: string }>} The generated username and password.
   */
  private async generateDefaultUsernameAndPassword(googleUser: GoogleUser) {
    let defaultUsername = googleUser.name.replace(/\s+/g, '_').toLowerCase();

    // Check if the generated username already exists
    let existingUser = await this.usersService.findUserByUsername(defaultUsername);

    // If the username exists, append a number to make it unique
    let counter = 1;
    while (existingUser) {
      defaultUsername = `${googleUser.name.replace(/\s+/g, '_').toLowerCase()}_${counter}`;
      existingUser = await this.usersService.findUserByUsername(defaultUsername);
      counter++;
    }

    // Generate a secure random password
    const defaultPassword = crypto.randomBytes(16).toString('hex');

    return { defaultUsername, defaultPassword };
  }

}
