/*
  Warnings:

  - You are about to drop the column `cursorApiKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `selectedCursorModel` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "cursorApiKey",
DROP COLUMN "selectedCursorModel",
ADD COLUMN     "huggingfaceApiKey" TEXT,
ADD COLUMN     "selectedHuggingfaceModel" TEXT;
