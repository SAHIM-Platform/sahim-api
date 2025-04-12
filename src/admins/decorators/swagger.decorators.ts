import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';

export function SwaggerAdminController() {
  return applyDecorators(
    ApiTags('Admin'),
    ApiBearerAuth('access-token'),
    ApiHeader({
      name: 'Authorization',
      description: 'Bearer token for authentication',
      required: true
    })
  );
}

export function SwaggerCreateAdmin() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new admin user' }),
    ApiResponse({
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
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Admin with this email or username already exists'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions (must be SUPER_ADMIN)'
    })
  );
}

export function SwaggerDeleteAdmin() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an admin user' }),
    ApiParam({ name: 'id', description: 'Admin user ID', type: 'number' }),
    ApiResponse({ status: 200, description: 'Admin user deleted successfully' }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Admin not found or attempting to delete a Super Admin'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions or trying to delete another admin'
    })
  );
}

export function SwaggerApproveStudent() {
  return applyDecorators(
    ApiOperation({ summary: 'Approve a student account' }),
    ApiParam({ name: 'id', description: 'Student ID', type: 'number' }),
    ApiResponse({ status: 200, description: 'Student approved successfully' }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Student not found, not a student, or already approved'
    }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  );
}

export function SwaggerRejectStudent() {
  return applyDecorators(
    ApiOperation({ summary: 'Reject a student account' }),
    ApiParam({ name: 'id', description: 'Student ID', type: 'number' }),
    ApiResponse({ status: 200, description: 'Student rejected successfully' }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Student not found, not a student, already rejected, or already approved'
    }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  );
}

export function SwaggerCreateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category' }),
    ApiResponse({
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
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 409, description: 'Conflict - Category with this name already exists' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  );
}

export function SwaggerDeleteCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a category' }),
    ApiParam({ name: 'id', description: 'Category ID', type: 'number' }),
    ApiResponse({ status: 200, description: 'Category deleted successfully' }),
    ApiResponse({ status: 404, description: 'Not Found - Category not found' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  );
}

export function SwaggerUpdateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a category' }),
    ApiParam({ name: 'id', description: 'Category ID', type: 'number' }),
    ApiResponse({
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
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 404, description: 'Not Found - Category not found' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  );
}

export function SwaggerGetAllStudents() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all students with optional filtering' }),
    ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number for pagination', example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of items per page', example: 10 }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      description: 'Filter by approval status'
    }),
    ApiResponse({
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
    }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  );
}

export function SwaggerSearchStudents() {
  return applyDecorators(
    ApiOperation({ summary: 'Search students', description: 'Search by name or academic number' }),
    ApiQuery({ name: 'query', required: true, example: '123', description: 'Search term' }),
    ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page' }),
    ApiResponse({ status: 200, description: 'Student search results', schema: { example: [{
      id: 4, name: "Name", email: "example@gmail.com", student: {
        id: 3, userId: 4, academicNumber: "1112345678910", department: "IT", studyLevel: 1,
        approvalStatus: "PENDING", approvalUpdatedByUserId: null
      }
    }]}}),
    ApiResponse({ status: 400, description: 'Bad Request', schema: { example: { statusCode: 400, message: ['query must be a string', 'page must not be less than 1', 'limit must not be greater than 50'], error: 'Bad Request' } }}),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Admin access required' })
  );
}
