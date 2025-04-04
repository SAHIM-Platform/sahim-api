/*
  Warnings:

  - The primary key for the `CommentVote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `CommentVote` table. All the data in the column will be lost.
  - Added the required column `voter_user_id` to the `CommentVote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BookmarkedThread" DROP CONSTRAINT "BookmarkedThread_thread_id_fkey";

-- DropForeignKey
ALTER TABLE "CommentVote" DROP CONSTRAINT "CommentVote_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "CommentVote" DROP CONSTRAINT "CommentVote_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ThreadComment" DROP CONSTRAINT "ThreadComment_thread_id_fkey";

-- DropForeignKey
ALTER TABLE "ThreadVote" DROP CONSTRAINT "ThreadVote_thread_id_fkey";

-- AlterTable
ALTER TABLE "CommentVote" DROP CONSTRAINT "CommentVote_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "voter_user_id" INTEGER NOT NULL,
ADD CONSTRAINT "CommentVote_pkey" PRIMARY KEY ("comment_id", "voter_user_id");

-- AddForeignKey
ALTER TABLE "ThreadComment" ADD CONSTRAINT "ThreadComment_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "Thread"("thread_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadVote" ADD CONSTRAINT "ThreadVote_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "Thread"("thread_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "ThreadComment"("comment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_voter_user_id_fkey" FOREIGN KEY ("voter_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkedThread" ADD CONSTRAINT "BookmarkedThread_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "Thread"("thread_id") ON DELETE CASCADE ON UPDATE CASCADE;
