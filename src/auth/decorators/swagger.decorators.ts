import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth
} from '@nestjs/swagger';
import { StudentSignUpDto } from '../dto/student-signup.dto';
import { SigninAuthDto } from '../dto/signin-auth.dto';
import { stat } from 'fs';

export function SwaggerAuth() {
  return applyDecorators(
    ApiTags('Authentication')
  );
}

export function SwaggerSignup() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new student user' }),
    ApiBody({ type: StudentSignUpDto,  description: 'User registration data. Password is required only for EMAIL_PASSWORD auth method.'}),
    ApiResponse({
      status: 201,
      description: 'User registered successfully',
      schema: {
        example: {
          statusCode: 201,
          message: 'User registered successfully',
          data: {
            accessToken: 'eyJhbGciOi...',
            user: {
              id: 1,
              email: 'user@example.com',
              username: 'username',
              name: 'User Name',
              role: 'STUDENT'
            }
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  );
}

export function SwaggerSignin() {
  return applyDecorators(
    ApiOperation({ summary: 'Sign in with email and password' }),
    ApiBody({ type: SigninAuthDto }),
    ApiResponse({
      status: 200,
      description: 'Sign in successful',
      schema: {
        example: {
          statusCode: 200,
          message: 'Sign in successful',
          data: {
            accessToken: 'eyJhbGciOi...',
            user: {
              id: 1,
              email: 'user@example.com',
              username: 'username',
              name: 'User Name',
              role: 'STUDENT'
            }
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  );
}

export function SwaggerRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh access token using refresh token' }),
    ApiCookieAuth('refreshToken'),
    ApiResponse({
      status: 200,
      description: 'Access token refreshed successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Access token refreshed successfully',
          data: {
            accessToken: 'eyJhbGciOi...',
            user: {
              id: 1,
              email: 'user@example.com',
              username: 'username',
              name: 'User Name',
              role: 'STUDENT'
            }
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid refresh token' })
  );
}

export function SwaggerSignout() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Sign out user and invalidate refresh token' }),
    ApiCookieAuth('refreshToken'),
    ApiResponse({
      status: 200,
      description: 'Sign out successful',
      schema: {
        example: {
          statusCode: 200,
          message: 'Sign out successful'
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing tokens' })
  );
}

export function SwaggerGoogleLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Initiate Google OAuth login' }),
    ApiResponse({ status: 302, description: 'Redirect to Google login page' })
  );
}

export function SwaggerGoogleCallback() {
  return applyDecorators(
    ApiOperation({ summary: 'Handle Google OAuth callback' }),
    ApiResponse({
      status: 200,
      description: 'Logged in successfully using Google',
      schema: {
        example: {
          msg: 'Logged in successfully using google',
          accessToken: 'eyJhbGciOi...'
        }
      }
    })
  );
}

export function SwaggerAuthStatus() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Check authentication status' }),
    ApiResponse({
      status: 200,
      description: 'User is authenticated',
      schema: {
        example: {
          msg: 'Authenticated'
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  );
}
