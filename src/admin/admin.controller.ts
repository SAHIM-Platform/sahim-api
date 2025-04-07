import { CreateCategoryDto } from '@/admin/dto/create-category.dto';
import { Roles } from '@/auth/decorators/role.decorator';
import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, Req, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminSignupDto } from './dto/create-admin.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('admin')
export class AdminController {
    constructor (private readonly adminService: AdminService) {}
    
    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    async createAdmin(@Body() dto: AdminSignupDto, @Res() res) {
        return await this.adminService.createAdmin(dto, res);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async deleteAdmin(@Req() req, @Param('id', ParseIntPipe) adminId: number) {
        const requesterId = req.user?.sub;
        const requesterRole = req.user?.role;
        return await this.adminService.deleteAdmin(adminId, requesterId, requesterRole);
    }

    @Patch('students/:id/approve')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async approveStudent(@Param('id', ParseIntPipe) studentId: number, @Req() req) {
        const userId = req.user?.sub;
        return await this.adminService.approveStudent(studentId, userId);
    }

    @Patch('students/:id/reject')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async rejectStudent(@Param('id', ParseIntPipe) studentId: number, @Req() req) {
        const userId = req.user?.sub;
        return await this.adminService.rejectStudent(studentId, userId);
    }

    @Post('categories')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async createCategory(@Body() input: CreateCategoryDto) {
        return await this.adminService.createCategory(input);
    }

    @Delete('categories/:id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async deleteCategory(@Param('id', ParseIntPipe) categoryId: number) {
        return await this.adminService.deleteCategory(categoryId);
    }

    @Patch('categories/:id')
  async updateCategory(
    @Param('id') categoryId: number,
    @Body() input: UpdateCategoryDto
  ) {
    return this.adminService.updateCategory(categoryId, input);
  }

}
