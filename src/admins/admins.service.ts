import { CreateCategoryDto } from '@/admins/dto/create-category.dto';
import { CategoryNotFoundException } from '@/admins/exceptions/category-not-found.exception';
import { AuthUtil } from '@/auth/utils/auth.util';
import { UsersService } from '@/users/users.service';
import { BadRequestException, ForbiddenException, Injectable, OnModuleInit, Res } from '@nestjs/common';
import { ApprovalStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AdminSignupDto } from './dto/create-admin.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryAlreadyExistsException } from './exceptions/category-already-exists.exception';
import { StudentQueryDto } from './dto/student-query.dto';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_USERNAME } from './utils/constans';
import { StudentSearchQueryDto } from './dto/search-student-query.dto';

@Injectable()
export class AdminsService implements OnModuleInit {

    constructor(
        private readonly usersService: UsersService,
        private readonly prisma: PrismaService,
        private readonly authUtil: AuthUtil
    ) { }


    async getAllAdmins() {
        const admins = await this.prisma.user.findMany({
            where: {
                role: UserRole.ADMIN,
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return [...admins];
    }



    /**
     * Lifecycle hook that runs when the module initializes.
     * Ensures that a default Super Admin exists in the database.
     */
    async onModuleInit() {
        await this.ensureSuperAdminExists();
        console.log('Inside init');
    }

    /**
     * Ensures that a Super Admin exists in the system.
     * If not, creates one using environment variables.
     */
    private async ensureSuperAdminExists() {
        if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_USERNAME || !SUPER_ADMIN_PASSWORD) {
            console.warn('Super Admin credentials are missing in .env file');
            return;
        }

        const existingSuperAdmin = await this.usersService.findUserByEmailOrUsername(
            SUPER_ADMIN_EMAIL, 
            SUPER_ADMIN_USERNAME
        );

        if (!existingSuperAdmin) {
            const hashedPassword = await this.authUtil.hashPassword(SUPER_ADMIN_USERNAME);

            await this.prisma.user.create({
                data: {
                    email: SUPER_ADMIN_EMAIL,
                    username: SUPER_ADMIN_USERNAME,
                    name: 'Super Admin',
                    password: hashedPassword,
                    role: UserRole.SUPER_ADMIN, 
                    photoPath: this.usersService.getDefaultPhotoPath(UserRole.SUPER_ADMIN),
                },
            });

            console.log('Default Super Admin created successfully');
        }
    }

    /**
     * Creates a new admin user.
     * @param {AdminSignupDto} input - Admin signup details.
     * @param {Response} res - HTTP response object.
     * @returns {Promise<{ message: string }>} Success message.
     * @throws {BadRequestException} If an admin with the same email or username already exists.
     */
    async createAdmin(input: AdminSignupDto) {
        const { email, name, username, password } = input;

        const existingUser = await this.usersService.findUserByEmailOrUsername(email, username);
        if (existingUser) {
            throw new BadRequestException('Admin with this email or username already exists');
        }

        const hashedPassword = await this.authUtil.hashPassword(password);

        await this.prisma.user.create({
            data: {
                ...input,
                password: hashedPassword,
                role: UserRole.ADMIN
            },
        });

        return { message: "Admin created successfully" };
    }

    /**
     * Deletes an admin user.
     * @param {number} adminId - ID of the admin to delete.
     * @param {number} requesterId - ID of the user making the request.
     * @param {UserRole} requesterRole - Role of the requesting user.
     * @returns {Promise<{ message: string }>} Success message.
     * @throws {BadRequestException} If the admin does not exist or if attempting to delete a Super Admin.
     * @throws {ForbiddenException} If an admin tries to delete another admin.
     */
    async deleteAdmin(adminId: number, requesterId: number, requesterRole: UserRole) {
        const admin = await this.usersService.findUserById(adminId);

        if (!admin) {
            throw new BadRequestException('Admin not found');
        }

        if (admin.role === UserRole.SUPER_ADMIN) {
            throw new BadRequestException("Super admin cannot be deleted");
        }

        if (requesterRole === UserRole.ADMIN && requesterId !== adminId) {
            throw new ForbiddenException('You are not allowed to delete other admins');
        }

        await this.prisma.user.delete({ where: { id: adminId } });

        return { message: "Admin deleted successfully" };
    }

    /**
     * Approves a student by updating their approval status.
     * @param {number} studentId - ID of the student to approve.
     * @returns {Promise<{ message: string }>} Success message.
     * @throws {BadRequestException} If the student does not exist, is not a student, or is already approved.
     */
    async approveStudent(studentId: number , adminUserId: number) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }  
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
            where: { id: studentId },
            data: { approvalStatus: ApprovalStatus.APPROVED , approvalUpdatedByUserId: adminUserId},
            
        });

        return { message: "Student approved successfully" };
    }

    /**
     * Rejects a student by updating their approval status.
     * @param {number} studentId - ID of the student to reject.
     * @returns {Promise<{ message: string }>} Success message.
     * @throws {BadRequestException} If the student does not exist, is not a student, or is already approved/rejected.
     */
    async rejectStudent(studentId: number, adminUserId: number) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }  
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
            where: { id: studentId },
            data: { approvalStatus: ApprovalStatus.REJECTED,
            approvalUpdatedByUserId: adminUserId ,
            }, 
        });

        return { message: "Student rejected successfully" };
    }

        /**
     * Creates a new category.
     * @param {CreateCategoryDto} input - The category details.
     * @returns {Promise<{ id: number, name: string }>} The created category.
     * @throws {BadRequestException} If a category with the same name already exists.
     */
        async createCategory(input: CreateCategoryDto, userId: number) {
          const { name } = input;
  
          // Check if category already exists
          const existingCategory = await this.prisma.category.findUnique({
              where: { name },
          });
  
          if (existingCategory) {
              throw new CategoryAlreadyExistsException(name);
          }
  
          // Create the new category
          const createdCategory = await this.prisma.category.create({
              data: {
                  name,
                  author_user_id: userId,
              },
          });
  
          return createdCategory;
      }
  
      /**
       * Deletes a category by its ID.
       * @param {number} categoryId - The ID of the category to delete.
       * @returns {Promise<{ message: string }>} Success message.
       * @throws {CategoryNotFoundException} If the category does not exist.
       */
      async deleteCategory(categoryId: number) {
          // Check if category exists
          const category = await this.prisma.category.findUnique({
              where: { category_id: categoryId },
          });
  
          if (!category) {
              throw new CategoryNotFoundException(categoryId);
          }

          // Check if there's at least one thread using this category
          const threadInUse = await this.prisma.thread.findFirst({
               where: { category_id: categoryId },
           });

           if (threadInUse) {
                // Prevent deletion if there's at least one thread using the category
               throw new BadRequestException('Cannot delete category that is still in use by threads');
           }

          // Delete the category
          await this.prisma.category.delete({
              where: { category_id: categoryId },
          });
  
          return { message: 'Category deleted successfully' };
      }

    /**
   * Updates an existing category.
   * @param {number} categoryId - The ID of the category to update.
   * @param {CreateCategoryDto} input - The updated category data.
   * @returns {Promise<any>} - The updated category.
   * @throws {CategoryNotFoundException} If category not found.
   */
  async updateCategory(categoryId: number, input: UpdateCategoryDto) {
    const { name } = input;

    const existingCategory = await this.prisma.category.findUnique({
      where: { category_id: categoryId },
    });

    if (!existingCategory) {
        throw new CategoryNotFoundException(categoryId);
    }

    return await this.prisma.category.update({
      where: { category_id: categoryId },
      data: {
        name,
      },
    });

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
