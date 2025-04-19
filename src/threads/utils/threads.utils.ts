import { Prisma, User, VoteType } from '@prisma/client';
import { FormattedVote } from '../types/threads.types';

export function formatVotes(
  votes: { vote_type: VoteType; voter_user_id: number }[],
  userId?: number
): FormattedVote {
  const upvotes = votes.filter(v => v.vote_type === 'UP').length;
  const downvotes = votes.length - upvotes;

  return {
    score: upvotes - downvotes,
    user_vote: userId
      ? votes.find(v => v.voter_user_id === userId)?.vote_type ?? null
      : null,
    counts: {
      up: upvotes,
      down: downvotes
    }
  };
}

export function buildThreadIncludeOptions(
  includeComments: boolean,
  includeVotes: boolean,
  page: number,
  limit: number
): Prisma.ThreadInclude {
    
  return {
    author: { select: { id: true, username: true, name: true } },
    category: true,
    votes: includeVotes 
      ? { select: { vote_type: true, voter_user_id: true } } 
      : false,
    comments: includeComments ? {
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'asc' },
      include: {
        author: { select: { id: true, username: true } },
        ...(includeVotes && { 
          votes: { select: { vote_type: true, voter_user_id: true } } 
        }),
      },
    } : false,
    _count: { 
        select: {
            comments: true,
            votes: true
          }
    },
  };
}

export function isUserDeleted(user: User): boolean {
  return user.isDeleted || user.name == null || user.password == null || user.name.trim() === '' || user.password.trim() === '';
}