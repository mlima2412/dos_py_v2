/*
  Warnings:

  - Added the required column `categoria_id` to the `rollup_despesas_mensais_categoria` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD COLUMN     "categoria_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria_despesas"("categoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;
