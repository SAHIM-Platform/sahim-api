import { CreateCategoryDto } from '@/admins/dto/create-category.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Roles } from '@/auth/decorators/role.decorator';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminManagementService } from './services/admin-management.service';
import {
    SwaggerAdminController,
    SwaggerApproveStudent,
    SwaggerCreateAdmin,
    SwaggerCreateCategory,
    SwaggerDeleteAdmin,
    SwaggerDeleteCategory,
    SwaggerGetAllStudents,
    SwaggerRejectStudent,
    SwaggerSearchStudents,
    SwaggerUpdateCategory
} from './decorators/swagger.decorators';
import { AdminSignupDto } from './dto/create-admin.dto';
import { StudentSearchQueryDto } from './dto/search-student-query.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryService } from './services/category.service';
import { StudentApprovalService } from './services/student-approval.service';

@SwaggerAdminController()
@Controller('admins')
export class AdminsController {

    constructor(
        private readonly adminManagementService: AdminManagementService,
        private readonly categoryService: CategoryService,
        private readonly studentApprovalService: StudentApprovalService,
    ) { }


    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    async getAllAdmins() {
        return this.adminManagementService.getAllAdmins();
    }

    @Post()
    @SwaggerCreateAdmin()
    @Roles(UserRole.SUPER_ADMIN)
    async createAdmin(@Body() dto: AdminSignupDto) {
        return await this.adminManagementService.createAdmin(dto);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerDeleteAdmin()
    async deleteAdmin(@GetUser() user, @Param('id', ParseIntPipe) adminId: number) {
        return await this.adminManagementService.deleteAdmin(adminId, user.id, user.role);
    }

    @Patch('students/:id/approve')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerApproveStudent()
    async approveStudent(@GetUser('sub') adminId, @Param('id', ParseIntPipe) userId: number) {
        return await this.studentApprovalService.approveStudent(userId, adminId);
    }

    @Patch('students/:id/reject')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerRejectStudent()
    async rejectStudent(@GetUser('sub') adminId, @Param('id', ParseIntPipe) userId: number) {
        return await this.studentApprovalService.rejectStudent(userId, adminId);
    }

    @Post('categories')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerCreateCategory()
    async createCategory(@GetUser('sub') userId: number, @Body() input: CreateCategoryDto) {
        return await this.categoryService.createCategory(input, userId);
    }

    @Delete('categories/:id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerDeleteCategory()
    async deleteCategory(@Param('id', ParseIntPipe) categoryId: number) {
        return await this.categoryService.deleteCategory(categoryId);
    }

    @Patch('categories/:id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerUpdateCategory()
    async updateCategory(
        @Param('id') categoryId: number,
        @Body() input: UpdateCategoryDto
    ) {
        return this.categoryService.updateCategory(categoryId, input);
    }

    @Get('users/students')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerGetAllStudents()
    async getAllStudents(@Query() query: StudentQueryDto) {
        return await this.studentApprovalService.getAllStudents(query);
    }

    @Get('users/students/search')
    @SwaggerSearchStudents()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    async searchStudents(@Query() query: StudentSearchQueryDto) {
        return this.studentApprovalService.searchStudents(query);
    }
}
