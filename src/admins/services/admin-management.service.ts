import { CreateCategoryDto } from '@/admins/dto/create-category.dto';
import { CategoryNotFoundException } from '@/admins/exceptions/category-not-found.exception';
import { AuthUtil } from '@/auth/utils/auth.helpers';
import { UserService } from '@/users/services/user.service';
import { BadRequestException, ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { ApprovalStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AdminSignupDto } from '../dto/create-admin.dto';
import { StudentSearchQueryDto } from '../dto/search-student-query.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryAlreadyExistsException } from '../exceptions/category-already-exists.exception';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_USERNAME } from '../utils/constans';
import { UserDetailsService } from '@/users/services/user-details.service';

@Injectable()
export class AdminManagementService implements OnModuleInit {

    constructor(
        private readonly userService: UserService,
        private readonly userDetailsService: UserDetailsService,
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

        const existingSuperAdmin = await this.userService.findUserByEmailOrUsername(
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
                    photoPath: this.userDetailsService.getDefaultPhotoPath(UserRole.SUPER_ADMIN),
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

        const existingUser = await this.userService.findUserByEmailOrUsername(email || '', username);
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
        const admin = await this.userService.findUserById(adminId);

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

}
