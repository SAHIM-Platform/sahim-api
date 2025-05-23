import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { ThreadService } from "./thread.service";
import { ApiResponse } from "@/common/interfaces/api-response.interface";

@Injectable()
export class BookmarkService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly threadService: ThreadService,
    ) {}
    
  /**
   * Bookmarks a specific thread for a user.
   * 
   * @param {number} userId - The ID of the user who is bookmarking the thread.
   * @param {number} threadId - The ID of the thread to be bookmarked.
   * @returns {Promise<{ message: string, success: boolean }>} Success message and status.
   * @throws {ForbiddenException} If the thread is already bookmarked by the user.
   */
  async bookmarkThread(userId: number, threadId: number): Promise<ApiResponse<null>> {
    await this.threadService.ensureThreadExists(threadId);

    const existingBookmark = await this.prisma.bookmarkedThread.findUnique({
      where: {
        user_id_thread_id: {
          user_id: userId,
          thread_id: threadId,
        },
      },
    });

    if (existingBookmark) {
      throw new ConflictException("Thread already bookmarked");
    }

    await this.prisma.bookmarkedThread.create({
      data: {
        user_id: userId,
        thread_id: threadId,
      },
    });

    return {
      message: 'Thread bookmarked successfully',
      data: null,
    };
  }

  /**
   * Removes a bookmark for a specific thread for the user.
   * 
   * @param {number} userId - The ID of the user who is unbookmarking the thread.
   * @param {number} threadId - The ID of the thread to be removed from bookmarks.
   * @returns {Promise<{ message: string, success: boolean }>} Success message and status.
   * @throws {ForbiddenException} If the thread is not bookmarked by the user.
   */
  async unbookmarkThread(userId: number, threadId: number): Promise<ApiResponse<null>> {
    await this.threadService.ensureThreadExists(threadId);

    const bookmarkedThread = await this.prisma.bookmarkedThread.findUnique({
      where: {
        user_id_thread_id: {
          user_id: userId,
          thread_id: threadId,
        },
      },
    });

    if (!bookmarkedThread) {
      throw new NotFoundException("Thread not bookmarked");
    }

    await this.prisma.bookmarkedThread.delete({
      where: {
        user_id_thread_id: {
          user_id: userId,
          thread_id: threadId,
        },
      },
    });

    return {
      message: 'Thread unbookmarked successfully',
      data: null,
    };
  }

}