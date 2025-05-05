import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { VoteDto } from "../dto/vote.dto";
import { formatVotes } from "../utils/threads.utils";
import { ThreadService } from "./thread.service";
import { ApiResponse } from "@/common/interfaces/api-response.interface";


@Injectable()
export class VotingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly threadService: ThreadService,
    ) {}

      /**
     * Votes on a thread (upvote/downvote)
     * @param userId - ID of the user casting the vote
     * @param threadId - ID of the thread being voted on
     * @param voteDto - Contains the vote type (upvote/downvote)
     * @returns Updated vote counts for the thread
     * @throws NotFoundException if the thread does not exist
     */
      async voteThread(userId: number, threadId: number, voteDto: VoteDto): Promise<ApiResponse<any>> {
        await this.threadService.ensureThreadExists(threadId);
    
        // First, check if the user has already voted on this thread
        const existingVote = await this.prisma.threadVote.findUnique({
          where: {
            thread_id_voter_user_id: {
              thread_id: threadId,
              voter_user_id: userId,
            },
          },
        });
    
        if (existingVote) {
          // If the same vote type is sent again, remove the vote (toggle)
          if (existingVote.vote_type === voteDto.vote_type) {
            await this.prisma.threadVote.delete({
              where: {
                thread_id_voter_user_id: {
                  thread_id: threadId,
                  voter_user_id: userId,
                },
              },
            });
          } else {
            // If a different vote type is sent, update the vote
            await this.prisma.threadVote.update({
              where: {
                thread_id_voter_user_id: {
                  thread_id: threadId,
                  voter_user_id: userId,
                },
              },
              data: {
                vote_type: voteDto.vote_type,
              },
            });
          }
        } else {
          // If no vote exists, create a new one
          await this.prisma.threadVote.create({
            data: {
              thread_id: threadId,
              voter_user_id: userId,
              vote_type: voteDto.vote_type,
            },
          });
        }
    
        const updatedVotes = await this.prisma.threadVote.findMany({
          where: { thread_id: threadId },
          select: { vote_type: true, voter_user_id: true },
        });
    
        return {
          message: 'Vote updated successfully',
          data: formatVotes(updatedVotes, userId),
        };
      }
    
      /**
       * Votes on a comment (upvote/downvote)
       * @param userId - ID of the user casting the vote
       * @param threadId - ID of the thread containing the comment
       * @param commentId - ID of the comment being voted on
       * @param voteDto - Contains the vote type (upvote/downvote)
       * @returns Updated vote counts for the comment
       * @throws NotFoundException if the comment does not exist
       */
      async voteComment(
        userId: number,
        threadId: number,
        commentId: number,
        voteDto: VoteDto,
      ): Promise<ApiResponse<any>> {
        const comment = await this.prisma.threadComment.findUnique({
          where: { comment_id: commentId, thread_id: threadId },
        });
    
        if (!comment) {
          throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }
    
        // First, check if the user has already voted on this comment
        const existingVote = await this.prisma.commentVote.findUnique({
          where: {
            comment_id_voter_user_id: {
              comment_id: commentId,
              voter_user_id: userId,
            },
          },
        });
    
        if (existingVote) {
          // If the same vote type is sent again, remove the vote (toggle)
          if (existingVote.vote_type === voteDto.vote_type) {
            await this.prisma.commentVote.delete({
              where: {
                comment_id_voter_user_id: {
                  comment_id: commentId,
                  voter_user_id: userId,
                },
              },
            });
          } else {
            // If a different vote type is sent, update the vote
            await this.prisma.commentVote.update({
              where: {
                comment_id_voter_user_id: {
                  comment_id: commentId,
                  voter_user_id: userId,
                },
              },
              data: {
                vote_type: voteDto.vote_type,
              },
            });
          }
        } else {
          // If no vote exists, create a new one
          await this.prisma.commentVote.create({
            data: {
              comment_id: commentId,
              voter_user_id: userId,
              vote_type: voteDto.vote_type,
            },
          });
        }
    
        const updatedVotes = await this.prisma.commentVote.findMany({
          where: { comment_id: commentId },
          select: { vote_type: true, voter_user_id: true },
        });
    
        return {
          message: 'Vote updated successfully',
          data: formatVotes(updatedVotes, userId),
        };
      }
}