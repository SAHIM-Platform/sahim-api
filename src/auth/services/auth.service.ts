import { SigninAuthDto } from '@/auth/dto/signin-auth.dto';
import { UsersService } from '@/users/users.service';
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
import { ApprovalStatus, AuthMethod, UserRole } from '@prisma/client';
import { compare as bCompare } from 'bcryptjs';
import * as crypto from 'crypto';
import { Response } from 'express';
import { PrismaService } from 'prisma/prisma.service';
import { StudentSignUpDto } from '../dto/student-signup.dto';
import { GoogleUser } from '../interfaces/google-user.interface';
import { AuthResponse, JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthUtil } from '../utils/auth.helpers';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';
import { GoogleAuthService } from './google-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authUtil: AuthUtil,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenService: TokenService,
    private readonly googleAuthService: GoogleAuthService
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
    const { email, username, name, password, academicNumber, department, studyLevel, authMethod = AuthMethod.EMAIL_PASSWORD } = input;
  
    // Validate that email is provided only for Google OAuth
    if (authMethod === AuthMethod.EMAIL_PASSWORD && email) {
      throw new BadRequestException('Email cannot be provided for EMAIL_PASSWORD authentication method');
    }

    if (authMethod === AuthMethod.OAUTH_GOOGLE && !email) {
      throw new BadRequestException('Email is required for Google OAuth authentication');
    }

    const existingUser = await this.usersService.findUserByEmailOrUsername(
      email || '',
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

    const hashedPassword = authMethod === AuthMethod.EMAIL_PASSWORD ? await this.authUtil.hashPassword(password!) : null;
    const createdUser = await this.prisma.user.create({
      data: {
        email,
        username,
        name: name,
        password: hashedPassword,
        authMethod,
        role: UserRole.STUDENT,
        photoPath: this.usersService.getDefaultPhotoPath(UserRole.STUDENT),
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

    const tokens = await this.tokenService.generateJwtTokens(
      createdUser.id,
      res.req,
    );
    this.authUtil.setRefreshTokenCookie(tokens.refreshToken, res);

    // After creating the user, fetch the user again including student data to return approvalStatus if the user is a student
    const userWithStudent = await this.prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { student: true },
    });

    // if user is not null
    if (!userWithStudent) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: tokens.accessToken,
      user: {
        id: createdUser.id,
        name: createdUser.name!,
        username: createdUser.username,
        role: createdUser.role,
        ...(userWithStudent.role === UserRole.STUDENT && userWithStudent.student && {
          approvalStatus: userWithStudent.student.approvalStatus
        }),
        photoPath: createdUser.photoPath || this.usersService.getDefaultPhotoPath(createdUser.role)
      }
    };
  }

 /**
   * Authenticates a user and generates new tokens.
   * Supports authentication via username or academic number (for email/password method).
   *
   * @param input - The user's signin information.
   * @param res - The Express response object (used for setting cookies).
   * @throws {BadRequestException} If required fields are missing or unsupported authMethod is provided.
   * @throws {UnauthorizedException} If credentials are invalid.
   * @returns {Promise<AuthResponse>} Authentication response with JWT tokens and user info.
   */
  async signin(
    input: SigninAuthDto,
    @Res() res: Response,
  ): Promise<AuthResponse> {
    const { identifier, password } = input;

    if (!identifier) {
      throw new BadRequestException('Username or academic number is required');
    }

    const user = await this.usersService.findUserByUsernameOrAcademicNumber(identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bCompare(password, user.password!);
    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }    

    await this.refreshTokenService.revokeAllRefreshTokens(user.id);

    const tokens = await this.tokenService.generateJwtTokens(user.id, res.req);
    this.authUtil.setRefreshTokenCookie(tokens.refreshToken, res);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name!,
        username: user.username,
        role: user.role,
        ...(user.role === UserRole.STUDENT && user.student && {
          approvalStatus: user.student.approvalStatus
        }),
        photoPath: user.photoPath || this.usersService.getDefaultPhotoPath(user.role)
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
    const isValid = await this.refreshTokenService.validateRefreshToken(
      refreshToken,
      userId,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.refreshTokenService.revokeAllRefreshTokens(userId);
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

    if (this.tokenService.isTokenExpired(storedToken.expiresAt)) {
      await this.refreshTokenService.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const payload = this.jwtService.verify<JwtPayload>(oldRefreshToken);
    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.sub !== storedToken.userId) {
      // revoke all tokens for this user for security purposes
      await this.refreshTokenService.revokeAllRefreshTokens(storedToken.userId);
      throw new UnauthorizedException('Invalid token');
    }

    // Revoke the used refresh token to prevent reuse
    await this.refreshTokenService.revokeRefreshToken(storedToken.id);

    // Generate new JWT tokens (access and refresh tokens)
    const tokens = await this.tokenService.generateJwtTokens(
      storedToken.userId,
      res.req,
    );

    this.authUtil.setRefreshTokenCookie(tokens.refreshToken, res);

    this.refreshTokenService.cleanupExpiredTokens().catch(console.error);

    // Fetch the user from the datebase incluading student data to return approvalStatus if the user is a student
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      include: { student: true },
    });
    // if user is not null
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: tokens.accessToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name!,
        username: storedToken.user.username,
        role: storedToken.user.role,
        ...(user.role === UserRole.STUDENT && user.student && {
          approvalStatus: user.student.approvalStatus
        }),
        photoPath: storedToken.user.photoPath || this.usersService.getDefaultPhotoPath(storedToken.user.role)
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
    if (!user || !user.password || user.isDeleted) return null;

    const passwordMatch = await bCompare(password, user.password);
    if (!passwordMatch) return null;

    return this.usersService.sanitizeUser(user);
  }

  /**
   * Handles Google OAuth authentication flow
   * @param googleUser - Contains Google-provided user data (email, name, picture)
   * @returns Existing authenticated user
   * @throws HttpException with status:
   *  - 428 (PRECONDITION_REQUIRED) if user needs to complete registration
   *  - 400/401 for invalid data or auth failures
   */
  async googleLogin(googleUser: GoogleUser) {
    return await this.googleAuthService.validateGoogleUser(googleUser);
  }
  
}
