import { SigninAuthDto } from '@/auth/dto/signin-auth.dto';
import { UserService } from '@/users/services/user.service';
import {
  BadRequestException,
  Injectable,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApprovalStatus, AuthMethod, UserRole } from '@prisma/client';
import { compare as bCompare } from 'bcryptjs';
import { Response } from 'express';
import { PrismaService } from 'prisma/prisma.service';
import { StudentSignUpDto } from '../dto/student-signup.dto';
import { GoogleUser } from '../interfaces/google-user.interface';
import { AuthResponse, JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthUtil } from '../utils/auth.helpers';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';
import { GoogleAuthService } from './google-auth.service';
import { TokenType } from '../enums/token-type.enum';
import { CookieService } from './cookie.service';
import { InvalidCredentialsException } from '../../common/exceptions/invalid-credentials.exception';
import { MissingIdentifierException } from '../exceptions/missing-identifier.exception';
import { AcademicNumberTakenException } from '../exceptions/academic-number-taken.exception';
import { UsernameTakenException } from '../exceptions/username-taken.exception';
import { EmailAlreadyExistsException } from '../exceptions/email-already-exists.exception';
import { UserDetailsService } from '@/users/services/user-details.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userDetailsService: UserDetailsService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authUtil: AuthUtil,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenService: TokenService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly cookieService: CookieService,
  ) {}

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
    const {
      email,
      username,
      name,
      password,
      academicNumber,
      department,
      studyLevel,
      authMethod = AuthMethod.EMAIL_PASSWORD,
    } = input;

    // Validate that email is provided only for Google OAuth
    if (authMethod === AuthMethod.EMAIL_PASSWORD && email) {
      throw new BadRequestException(
        'Email cannot be provided for EMAIL_PASSWORD authentication method',
      );
    }

    if (authMethod === AuthMethod.OAUTH_GOOGLE && !email) {
      throw new BadRequestException(
        'Email is required for Google OAuth authentication',
      );
    }

    const existingUser = await this.userService.findUserByEmailOrUsername(
      email || '',
      username,
    );

    if (existingUser) {
      if (existingUser.email === email) {
        throw new EmailAlreadyExistsException();
      }
      if (existingUser.username === username) {
        throw new UsernameTakenException();
      }
    }

    const existingStudent = await this.prisma.student.findUnique({
      where: { academicNumber },
    });

    if (existingStudent) {
      // If academic number is already taken
      throw new AcademicNumberTakenException();
    }

    const hashedPassword =
      authMethod === AuthMethod.EMAIL_PASSWORD
        ? await this.authUtil.hashPassword(password!)
        : null;
    const createdUser = await this.prisma.user.create({
      data: {
        email,
        username,
        name: name,
        password: hashedPassword,
        authMethod,
        role: UserRole.STUDENT,
        photoPath: this.userDetailsService.getDefaultPhotoPath(UserRole.STUDENT),
        student: {
          create: {
            academicNumber,
            department,
            studyLevel,
            approvalStatus: ApprovalStatus.PENDING,
          },
        },
      },
    });

    const tokens = await this.tokenService.generateJwtTokens(
      createdUser.id,
      res.req,
    );
    this.cookieService.setRefreshTokenCookie(tokens.refreshToken, res);

    // After creating the user, fetch the user again including student data to return approvalStatus if the user is a student
    const userWithStudent = await this.prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { student: true },
    });


    return {
      message: 'Sign up successful',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: createdUser.id,
          name: createdUser.name!,
          username: createdUser.username,
          role: createdUser.role,
          ...(userWithStudent!.role === UserRole.STUDENT &&
            userWithStudent!.student && {
              approvalStatus: userWithStudent!.student.approvalStatus,
            }),
          photoPath:
            createdUser.photoPath ||
            this.userDetailsService.getDefaultPhotoPath(createdUser.role),
        },
      },
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
      throw new MissingIdentifierException();
    }

    const user =
      await this.userService.findUserByUsernameOrAcademicNumber(identifier);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatch = await bCompare(password, user.password!);
    if (!passwordMatch) {
      throw new InvalidCredentialsException();
    }

    const tokens = await this.tokenService.generateJwtTokens(user.id, res.req);
    this.cookieService.setRefreshTokenCookie(tokens.refreshToken, res);

    return {
      message: 'Sign in successful',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          name: user.name!,
          username: user.username,
          role: user.role,
          ...(user.role === UserRole.STUDENT && user.student && {
            approvalStatus: user.student.approvalStatus,
          }),
          photoPath: user.photoPath || this.userDetailsService.getDefaultPhotoPath(user.role),
        },
      },
    };
  }

  /**
   * Signs out a user by revoking their refresh token.
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

    const storedToken =
      await this.refreshTokenService.getValidStoredRefreshTokenByUserId(
        refreshToken,
        userId,
      );
    await this.refreshTokenService.revokeRefreshToken(storedToken!.id);
    this.cookieService.unsetRefreshTokenCookie(res);
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
    if (payload.tokenType !== TokenType.REFRESH) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.sub !== storedToken.userId) {
      // revoke all tokens for this user for security purposes
      await this.refreshTokenService.revokeAllUserRefreshTokens(
        storedToken.userId,
      );
      throw new UnauthorizedException('Invalid token');
    }

    // Revoke the used refresh token to prevent reuse
    await this.refreshTokenService.revokeRefreshToken(storedToken.id);

    // Generate new JWT tokens (access and refresh tokens)
    const tokens = await this.tokenService.generateJwtTokens(
      storedToken.userId,
      res.req,
    );

    this.cookieService.setRefreshTokenCookie(tokens.refreshToken, res);

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
      message: 'Access token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: storedToken.user.id,
          name: storedToken.user.name!,
          username: storedToken.user.username,
          role: storedToken.user.role,
          ...(user.role === UserRole.STUDENT &&
            user.student && {
              approvalStatus: user.student.approvalStatus,
            }),
          photoPath:
            storedToken.user.photoPath ||
            this.userDetailsService.getDefaultPhotoPath(storedToken.user.role),
        },
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
    const user = await this.userService.findUserByEmail(email);
    if (!user || !user.password || user.isDeleted) return null;

    const passwordMatch = await bCompare(password, user.password);
    if (!passwordMatch) return null;

    return this.userService.sanitizeUser(user);
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
