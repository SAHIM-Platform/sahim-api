import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole, ApprovalStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { StudentSearchQueryDto } from '../dto/search-student-query.dto';
import { StudentQueryDto } from '../dto/student-query.dto';

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
  async approveStudent(userId: number, adminUserId: number) {
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

    return { message: 'Student approved successfully' };
  }

  /**
   * Rejects a student by updating their approval status.
   * @param {number} studentId - ID of the student to reject.
   * @returns {Promise<{ message: string }>} Success message.
   * @throws {BadRequestException} If the student does not exist, is not a student, or is already approved/rejected.
   */
  async rejectStudent(userId: number, adminUserId: number) {
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

    return { message: 'Student rejected successfully' };
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
 async getAllStudents(query: StudentQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;
  
    const where: any = { role: UserRole.STUDENT };
  
    if (status) {
      where.student = { approvalStatus: status };
    }
  
    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

    /**
     * Searches for students by name or academic number, with an optional filter for approval status.
     * 
     * @param {StudentSearchQueryDto} query - The query parameters for the student search.
     * @param {string} query.query - The search term (name or academic number) to filter students.
     * @param {number} [query.page=1] - The page number for pagination (defaults to 1).
     * @param {number} [query.limit=10] - The number of students per page (defaults to 10).
     * @param {ApprovalStatus} [query.status] - The approval status to filter students by (optional).
     * 
     * @returns {Promise<any[]>} A promise that resolves to an array of students matching the search criteria.
     * 
     * @throws {BadRequestException} If any invalid parameter is provided.
     * 
     */
    async searchStudents(query: StudentSearchQueryDto) {
        const { query: searchTerm, page = 1, limit = 10, status } = query;
        const skip = (page - 1) * limit;
        
        const where: any = {
            role: UserRole.STUDENT,
            OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { student: { academicNumber: { contains: searchTerm, mode: 'insensitive' } } },
            ],
        };
    
        if (status) {
            where.student = { approvalStatus: status };
        }
    
        return this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
            id: true,
            name: true,
            email: true,
            student: true,
        },
        orderBy: {
            name: 'asc'
        }
        });
    }  
}
