import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole, ApprovalStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { StudentSearchQueryDto } from '../dto/search-student-query.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { ApiResponse } from '@/common/interfaces/api-response.interface';
import { StudentsListResponse } from '../interfaces/students-list-response.interface';

@Injectable()
export class StudentApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    
  ) {}

  /**
   * Approves a student by updating their approval status.
   * @param {number} studentId - ID of the student to approve.
   * @returns {Promise<{ message: string }>} Success message.
   * @throws {BadRequestException} If the student does not exist, is not a student, or is already approved.
   */
  async approveStudent(userId: number, adminUserId: number): Promise<ApiResponse<null>> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    if (student.user.role !== UserRole.STUDENT) {
      throw new BadRequestException('User is not a student');
    }

    if (student.approvalStatus === ApprovalStatus.APPROVED) {
      throw new BadRequestException('Student is already approved');
    }

    await this.prisma.student.update({
      where: { userId },
      data: {
        approvalStatus: ApprovalStatus.APPROVED,
        approvalUpdatedByUserId: adminUserId,
      },
    });

    return {
        message: 'Student approved successfully',
        data: null,
    }
  }

  /**
   * Rejects a student by updating their approval status.
   * @param {number} studentId - ID of the student to reject.
   * @returns {Promise<{ message: string }>} Success message.
   * @throws {BadRequestException} If the student does not exist, is not a student, or is already approved/rejected.
   */
  async rejectStudent(userId: number, adminUserId: number): Promise<ApiResponse<null>> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    if (student.user.role !== UserRole.STUDENT) {
      throw new BadRequestException('User is not a student');
    }

    if (student.approvalStatus === ApprovalStatus.REJECTED) {
      throw new BadRequestException('Student is already rejected');
    }

    if (student.approvalStatus === ApprovalStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an approved student');
    }

    await this.prisma.student.update({
      where: { userId },
      data: {
        approvalStatus: ApprovalStatus.REJECTED,
        approvalUpdatedByUserId: adminUserId,
      },
    });

    return {
        message: 'Student rejected successfully',
        data: null,
    }
  }

 /**
  * Retrieves a paginated list of students with optional approval status filter.
  * 
  * @param {StudentQueryDto} query - Pagination and filter parameters.
  * @param {number} [query.page=1] - Page number.
  * @param {number} [query.limit=10] - Students per page.
  * @param {ApprovalStatus} [query.status] - Optional approval status filter.
  * 
  * @returns {Promise<{ data: Array<Object>, meta: Object }>} - Paginated list of students and metadata.
  */
 async getAllStudents(query: StudentQueryDto): Promise<ApiResponse<StudentsListResponse[]>> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;
  
    const where: any = { role: UserRole.STUDENT };
    const andConditions: Array<Record<string, any>> = [];
  
    if (status) {
        andConditions.push({ student: { approvalStatus: status } });
      }
  
      if (search) {
        andConditions.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { student: { academicNumber: { contains: search, mode: 'insensitive' } } },
          ]
        });
      }
  
      if (andConditions.length > 0) {
        where.AND = andConditions;
      }
  
    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: search ? { name: 'asc' } : { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          student: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
  
    return {
      message: 'Students retrieved successfully',
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

}
