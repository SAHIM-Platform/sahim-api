import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { CategoryAlreadyExistsException } from "../exceptions/category-already-exists.exception";
import { CategoryNotFoundException } from "../exceptions/category-not-found.exception";
import { PrismaService } from "prisma/prisma.service";
import { ApiResponse } from "@/common/interfaces/api-response.interface";
import { Category } from "@prisma/client";
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    /**
     * Creates a new category.
     * @param {CreateCategoryDto} input - The category details.
     * @returns {Promise<{ id: number, name: string }>} The created category.
     * @throws {BadRequestException} If a category with the same name already exists.
     */
    async createCategory(input: CreateCategoryDto, userId: number): Promise<ApiResponse<Category>> {
        // Sanitize the raw input
        const cleanName = sanitizeHtml(input.name, {
            allowedTags: [],        
            allowedAttributes: {},  
        }).trim();
    
        //Reject if nothing remains
        if (!cleanName) {
            throw new BadRequestException(
            'Category name is invalid after sanitization.'
            );
        }

        // Check if category already exists
        const existingCategory = await this.prisma.category.findUnique({
            where: { name: cleanName },
        });

        if (existingCategory) {
            throw new CategoryAlreadyExistsException(cleanName);
        }

        // Create the new category
        const createdCategory = await this.prisma.category.create({
            data: {
                name: cleanName,
                author_user_id: userId,
            },
        });

        return {
        message: 'Category created successfully',
        data: createdCategory
        }
    }
  
    /**
     * Deletes a category by its ID.
     * @param {number} categoryId - The ID of the category to delete.
     * @returns {Promise<{ message: string }>} Success message.
     * @throws {CategoryNotFoundException} If the category does not exist.
     */
    async deleteCategory(categoryId: number): Promise<ApiResponse<null>> {
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

        return {
        message: 'Category deleted successfully',
        data: null,
    };
    }

  /**
   * Updates an existing category.
   * @param {number} categoryId - The ID of the category to update.
   * @param {CreateCategoryDto} input - The updated category data.
   * @returns {Promise<any>} - The updated category.
   * @throws {CategoryNotFoundException} If category not found.
   */
  async updateCategory(categoryId: number, input: UpdateCategoryDto): Promise<ApiResponse<Category>> {
    const { name } = input;

    const existingCategory = await this.prisma.category.findUnique({
      where: { category_id: categoryId },
    });

    if (!existingCategory) {
        throw new CategoryNotFoundException(categoryId);
    }
    
    const updatedCategory = await this.prisma.category.update({
        where: { category_id: categoryId },
        data: {
            name,
        },
        });

    return {
        message: 'Category updated successfully',
        data: updatedCategory,
    }
  }
}