/*
  Warnings:

  - You are about to drop the column `perfil_id` on the `usuario` table. All the data in the column will be lost.
  - Added the required column `perfil_id` to the `usuario_parceiro` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."usuario" DROP CONSTRAINT "usuario_perfil_id_fkey";

-- AlterTable
ALTER TABLE "public"."usuario" DROP COLUMN "perfil_id";

-- AlterTable
ALTER TABLE "public"."usuario_parceiro" ADD COLUMN     "perfil_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."usuario_parceiro" ADD CONSTRAINT "usuario_parceiro_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
