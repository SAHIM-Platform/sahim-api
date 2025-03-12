import {
  BadRequestException,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authUtil: AuthUtil,
  ) {}

  /**
   * Registers a new user with the provided information.
   * @param input - The user's signup information.
   * @param res - The Express response object (used for setting cookies).
   * @throws {BadRequestException} If a user with the given email or username already exists.
   * @returns {Promise<AuthResponse>} Authentication response with tokens.
   */
  async signup(
    input: SignupAuthDto,
    @Res() res: Response,
  ): Promise<AuthResponse> {
    const { email, username, password } = input;

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

    const hashedPassword = await this.authUtil.hashPassword(password);

    const createdUser = await this.prisma.user.create({
      data: {
        ...input,
        password: hashedPassword,
      },
    });

    const tokens = await this.authUtil.generateJwtTokens(
      createdUser.id,
      res.req,
    );
    this.authUtil.setRefreshTokenCookie(tokens.refreshToken, res);

    return { accessToken: tokens.accessToken };
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

    return { accessToken: tokens.accessToken };
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
   * @returns {Promise<{ accessToken: string }>} The new access token.
   */
  async refreshToken(
    oldRefreshToken: string,
    @Res() res: Response,
  ): Promise<{ accessToken: string }> {
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

    return { accessToken: tokens.accessToken };
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
  async validateGoogleUser(googleUser:SigninAuthDto){
    const user=await this.usersService.findUserByEmail(googleUser.email);
    if(user)return user;
  }
}
