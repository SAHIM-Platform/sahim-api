import { VoteType } from "@prisma/client";

export interface FormattedVote {
  score: number;
  user_vote: VoteType | null;
  counts: {
    up: number;
    down: number;
  };
}

export interface AuthorInfo {
  id: number;
  username: string;
  name: string | null;
  photoPath: string | null;
}

export interface CommentResponse {
  comment_id: number;
  thread_id: number;
  author_user_id: number;
  content: string;
  created_at: Date;
  author: AuthorInfo;
  votes: FormattedVote; 
}
