/*
  Warnings:

  - Added the required column `id_usuario` to the `movimento_estoque` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."movimento_estoque" ADD COLUMN     "id_usuario" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
