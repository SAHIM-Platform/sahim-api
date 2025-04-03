import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ApprovalStatus, UserRole } from '@prisma/client';

@Injectable()
export class ApprovedStudentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
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
        throw new ForbiddenException('Student not found');
      }

      if (student.approvalStatus === ApprovalStatus.APPROVED) {
        return true;
      }

      throw new ForbiddenException('Student not approved');
    }

    // If not admin and not student, block access
    throw new ForbiddenException('Access denied');
  }
}
