-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "author_user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
