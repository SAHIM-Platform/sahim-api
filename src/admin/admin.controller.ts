import { CreateCategoryDto } from '@/admin/dto/create-category.dto';
import { Roles } from '@/auth/decorators/role.decorator';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminSignupDto } from './dto/create-admin.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'Authorization', description: 'Bearer token for authentication', required: true })
@Controller('admin')
export class AdminController {
    constructor (private readonly adminService: AdminService) {}
    
    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new admin user' })
    @ApiResponse({ 
        status: 201, 
        description: 'Admin user created successfully',
        schema: {
            example: {
                message: 'Admin user created successfully',
                user: {
                    id: 1,
                    email: 'admin@example.com',
                    username: 'admin1',
                    name: 'Admin Name',
                    role: 'ADMIN'
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad Request - Admin with this email or username already exists' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions (must be SUPER_ADMIN)' })
    async createAdmin(@Body() dto: AdminSignupDto, @Res() res) {
        return await this.adminService.createAdmin(dto, res);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete an admin user' })
    @ApiParam({ name: 'id', description: 'Admin user ID', type: 'number' })
    @ApiResponse({ status: 200, description: 'Admin user deleted successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Admin not found or attempting to delete a Super Admin' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions or trying to delete another admin' })
    async deleteAdmin(@GetUser() user, @Param('id', ParseIntPipe) adminId: number) {
        return await this.adminService.deleteAdmin(adminId, user.id, user.role);
    }

    @Patch('students/:id/approve')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Approve a student account' })
    @ApiParam({ name: 'id', description: 'Student ID', type: 'number' })
    @ApiResponse({ status: 200, description: 'Student approved successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Student not found, not a student, or already approved' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async approveStudent(@GetUser('sub') userId, @Param('id', ParseIntPipe) studentId: number) {
        return await this.adminService.approveStudent(studentId, userId);
    }

    @Patch('students/:id/reject')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Reject a student account' })
    @ApiParam({ name: 'id', description: 'Student ID', type: 'number' })
    @ApiResponse({ status: 200, description: 'Student rejected successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Student not found, not a student, already rejected, or already approved' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async rejectStudent(@GetUser('sub') userId,@Param('id', ParseIntPipe) studentId: number) {
        return await this.adminService.rejectStudent(studentId, userId);
    }

    @Post('categories')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new category' })
    @ApiResponse({ 
        status: 201, 
        description: 'Category created successfully',
        schema: {
            example: {
                id: 1,
                name: 'Category Name',
                description: 'Category Description',
                createdAt: '2024-04-09T12:00:00Z',
                updatedAt: '2024-04-09T12:00:00Z'
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
    @ApiResponse({ status: 409, description: 'Conflict - Category with this name already exists' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async createCategory(@GetUser('sub') userId: number,@Body() input: CreateCategoryDto) {
        return await this.adminService.createCategory(input, userId);
    }

    @Delete('categories/:id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a category' })
    @ApiParam({ name: 'id', description: 'Category ID', type: 'number' })
    @ApiResponse({ status: 200, description: 'Category deleted successfully' })
    @ApiResponse({ status: 404, description: 'Not Found - Category not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async deleteCategory(@Param('id', ParseIntPipe) categoryId: number) {
        return await this.adminService.deleteCategory(categoryId);
    }

    @Patch('categories/:id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update a category' })
    @ApiParam({ name: 'id', description: 'Category ID', type: 'number' })
    @ApiResponse({ 
        status: 200, 
        description: 'Category updated successfully',
        schema: {
            example: {
                id: 1,
                name: 'Updated Category Name',
                description: 'Updated Category Description',
                updatedAt: '2024-04-09T12:00:00Z'
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
    @ApiResponse({ status: 404, description: 'Not Found - Category not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async updateCategory(
    @Param('id') categoryId: number,
    @Body() input: UpdateCategoryDto
    ) {
        return this.adminService.updateCategory(categoryId, input);
    }

    @Get('users/students')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all students with optional filtering' })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number for pagination', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of items per page', example: 10 })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Filter by approval status' })
    @ApiResponse({ 
        status: 200, 
        description: 'List of students retrieved successfully',
        schema: {
            example: {
                data: [
                    {
                        id: 1,
                        email: 'student@example.com',
                        username: 'student1',
                        name: 'Student Name',
                        approvalStatus: 'PENDING'
                    }
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10
                }
            }
        }
    })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async getAllStudents(@Query() query: StudentQueryDto) {
        return await this.adminService.getAllStudents(query);
    }
}
