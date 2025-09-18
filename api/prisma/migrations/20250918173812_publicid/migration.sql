/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `transferencia_estoque` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `public_id` to the `transferencia_estoque` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."transferencia_estoque" ADD COLUMN     "public_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transferencia_estoque_public_id_key" ON "public"."transferencia_estoque"("public_id");
