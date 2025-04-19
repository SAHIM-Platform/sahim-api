import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ApprovalStatus, UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';


@Injectable()
export class ApprovedStudentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // allow to @Public 
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, handler);
    if (isPublic) return true;
    // allow to /auth/signout
    const url = request.url;
    if (url === '/auth/signout' || url.startsWith('/auth/signout?')) {
      return true;
    }

    const userId = request.user?.sub; // Assuming the user ID is stored in the JWT payload
    const userRole = request.user?.role; // Assuming the role is in the JWT payload

    // If the user is an admin or the super admin, bypass the check
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) {
      return true;
    }

    // If the user is a student, check their approval status
    if (userRole === UserRole.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });

      if (!student) {
        throw new ForbiddenException({
          error: 'Student profile not found',
          message: 'Student profile does not exist for this account',
          statusCode: 403
        });
      }

      if (student.approvalStatus === ApprovalStatus.APPROVED) {
        return true;
      }

      throw new ForbiddenException({
        error: 'Student not approved',
        message: 'Student account requires administrator approval',
        statusCode: 403
      });
    }

    // If not admin and not student, block access
    throw new ForbiddenException({
      error: 'Unauthorized access',
      message: 'Insufficient permissions for this resource',
      statusCode: 403
    });
  }
}
