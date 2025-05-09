import { Injectable, NotFoundException } from "@nestjs/common";
import { CommentQueryDto } from "../dto/comment-query.dto";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { UpdateCommentDto } from "../dto/update-comment.dto";
import { SortType } from "../enum/sort-type.enum";
import { formatVotes } from "../utils/threads.utils";
import { PrismaService } from "prisma/prisma.service";
import { ThreadService } from "./thread.service";
import { ApiResponse } from "@/common/interfaces/api-response.interface";
import { CommentResponse } from "../interfaces/comment-response.interface";
import { CommentNotFoundException } from "../exceptions/comment-not-found.exception";


@Injectable()
export class CommentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly threadService: ThreadService,
    ) {}

      /**
       * Creates a new comment in a thread
       * @param userId - ID of the user creating the comment
       * @param threadId - ID of the thread to comment on
       * @param createCommentDto - Data for the new comment
       * @returns The created comment with author information and vote counts
       */
      async createComment(
        userId: number,
        threadId: number,
        createCommentDto: CreateCommentDto,
      ): Promise<ApiResponse<CommentResponse>> {
        await this.threadService.ensureThreadExists(threadId);
    
        const comment = await this.prisma.threadComment.create({
          data: {
            ...createCommentDto,
            thread_id: threadId,
            author_user_id: userId,
          },
          include: {
<<<<<<< HEAD
            author: { select: { id: true, username: true, name: true, photoPath: true, isDeleted: true  } },
=======
            author: { select: { id: true, username: true, name: true, photoPath: true, role: true, student: { select: { department: true }}, isDeleted: true } },
>>>>>>> main
            votes: { select: { vote_type: true, voter_user_id: true } },
          },
        });
    
        return ({
          message: 'Comment created successfully',
          data: {
            ...comment,
            votes: formatVotes(comment.votes, userId),
          },
        });
      }
    
      /**
       * Updates an existing comment in a thread
       * @param userId - ID of the user attempting the update
       * @param threadId - ID of the thread containing the comment
       * @param commentId - ID of the comment to update
       * @param updateCommentDto - Data to update the comment with
       * @returns The updated comment with formatted votes
       * @throws NotFoundException if comment doesn't exist or doesn't belong to the user
       */
      async updateComment(
        userId: number,
        threadId: number,
        commentId: number,
        updateCommentDto: UpdateCommentDto,
      ): Promise<ApiResponse<CommentResponse>> {
        await this.threadService.ensureThreadExists(threadId); // Ensure the thread exists
        // Verify comment exists and belongs to user
        const comment = await this.prisma.threadComment.findUnique({
          where: {
            comment_id: commentId,
            thread_id: threadId,
            author_user_id: userId,
          },
        });
    
        if (!comment) {
          throw new CommentNotFoundException(commentId);
        }
    
        const updatedComment = await this.prisma.threadComment.update({
          where: { comment_id: commentId },
          data: updateCommentDto,
          include: {
<<<<<<< HEAD
            author: { select: { id: true, username: true, name: true, photoPath: true, isDeleted: true  } },
=======
            author: { select: { id: true, username: true, name: true, photoPath: true, role: true, student: { select: { department: true }}, isDeleted: true } },
>>>>>>> main
            votes: { select: { vote_type: true, voter_user_id: true } },
          },
        });
    
        return ({
          message: 'Comment updated successfully',
          data: {
            ...updatedComment,
            votes: formatVotes(updatedComment.votes, userId),
          },
        });
      }
    
    
      /**
       * Deletes a comment from a thread
       * @param userId - ID of the user attempting the deletion
       * @param threadId - ID of the thread containing the comment
       * @param commentId - ID of the comment to delete
       * @returns Success status
       * @throws NotFoundException if comment doesn't exist or doesn't belong to the user
       */
      async deleteComment(
        userId: number,
        threadId: number,
        commentId: number,
      ): Promise<ApiResponse<null>> {
        await this.threadService.ensureThreadExists(threadId); // Ensure the thread exists
    
        // Verify comment exists and belongs to user
        const comment = await this.prisma.threadComment.findFirst({
          where: {
            comment_id: commentId,
            thread_id: threadId,
            author_user_id: userId,
          },
        });
    
        if (!comment) {
          throw new CommentNotFoundException(commentId);
        }
    
        await this.prisma.threadComment.delete({ where: { comment_id: commentId } });
        return {
            message: 'Comment deleted successfully',
            data: null,
        }
      }
    
    
      /**
       * Retrieves a paginated list of comments for a specific thread
       * @param threadId - ID of the thread to retrieve comments for
       * @param query - Query parameters including page, limit, and sort type
       * @param userId - Optional ID of the requesting user for vote status
       * @returns Paginated list of comments with metadata
       * @throws NotFoundException if thread doesn't exist
       */
      async getThreadComments(
        threadId: number,
        query: CommentQueryDto,
        userId?: number,
      ): Promise<ApiResponse<CommentResponse[]>> {
        await this.threadService.ensureThreadExists(threadId);
        const { page = 1, limit = 10, sort = SortType.LATEST } = query;
    
        const orderBy = {
          created_at: sort === SortType.OLDEST ? 'asc' as const : 'desc' as const,
        };
    
        const [comments, total] = await Promise.all([
          this.prisma.threadComment.findMany({
            where: { thread_id: threadId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            include: {
              author: { select: { id: true, username: true, name: true, photoPath: true, role: true, student: { select: { department: true }}, isDeleted: true } },
              votes: { select: { vote_type: true, voter_user_id: true } },
            },
          }),
          this.prisma.threadComment.count({
            where: { thread_id: threadId },
          }),
        ]);
    
        const formattedComments = comments.map(comment => ({
          ...comment,
          votes: formatVotes(comment.votes, userId),
        }));
    
        return {
          message: 'Comments retrieved successfully',
          data: formattedComments,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
}