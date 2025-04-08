-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "approvalUpdatedByUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_approvalUpdatedByUserId_fkey" FOREIGN KEY ("approvalUpdatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
