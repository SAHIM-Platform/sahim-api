import { CreateCategoryDto } from '@/admins/dto/create-category.dto';
import { Roles } from '@/auth/decorators/role.decorator';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminsService } from './admins.service';
import { AdminSignupDto } from './dto/create-admin.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import {
    SwaggerAdminController,
    SwaggerCreateAdmin,
    SwaggerDeleteAdmin,
    SwaggerApproveStudent,
    SwaggerRejectStudent,
    SwaggerCreateCategory,
    SwaggerDeleteCategory,
    SwaggerUpdateCategory,
    SwaggerGetAllStudents,
    SwaggerSearchStudents
} from './decorators/swagger.decorators';
import { StudentSearchQueryDto } from './dto/search-student-query.dto';

@SwaggerAdminController()
@Controller('admins')
export class AdminsController {


    constructor(private readonly adminsService: AdminsService) { }


    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    async getAllAdmins() {
        return this.adminsService.getAllAdmins();
    }


    @Post()
    @SwaggerCreateAdmin()
    @Roles(UserRole.SUPER_ADMIN)
    async createAdmin(@Body() dto: AdminSignupDto) {
        return await this.adminsService.createAdmin(dto);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerDeleteAdmin()
    async deleteAdmin(@GetUser() user, @Param('id', ParseIntPipe) adminId: number) {
        return await this.adminsService.deleteAdmin(adminId, user.id, user.role);
    }

    @Patch('students/:id/approve')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerApproveStudent()
    async approveStudent(@GetUser('sub') userId, @Param('id', ParseIntPipe) studentId: number) {
        return await this.adminsService.approveStudent(studentId, userId);
    }

    @Patch('students/:id/reject')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerRejectStudent()
    async rejectStudent(@GetUser('sub') userId, @Param('id', ParseIntPipe) studentId: number) {
        return await this.adminsService.rejectStudent(studentId, userId);
    }

    @Post('categories')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerCreateCategory()
    async createCategory(@GetUser('sub') userId: number, @Body() input: CreateCategoryDto) {
        return await this.adminsService.createCategory(input, userId);
    }

    @Delete('categories/:id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerDeleteCategory()
    async deleteCategory(@Param('id', ParseIntPipe) categoryId: number) {
        return await this.adminsService.deleteCategory(categoryId);
    }

    @Patch('categories/:id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerUpdateCategory()
    async updateCategory(
        @Param('id') categoryId: number,
        @Body() input: UpdateCategoryDto
    ) {
        return this.adminsService.updateCategory(categoryId, input);
    }

    @Get('users/students')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @SwaggerGetAllStudents()
    async getAllStudents(@Query() query: StudentQueryDto) {
        return await this.adminsService.getAllStudents(query);
    }

    @Get('users/students/search')
    @SwaggerSearchStudents()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    async searchStudents(@Query() query: StudentSearchQueryDto) {
        return this.adminsService.searchStudents(query);
    }
}
