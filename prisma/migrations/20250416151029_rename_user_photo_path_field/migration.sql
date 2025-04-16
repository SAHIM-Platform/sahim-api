/*
  Warnings:

  - You are about to drop the column `photo_path` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "photo_path",
ADD COLUMN     "photoPath" TEXT DEFAULT '';
