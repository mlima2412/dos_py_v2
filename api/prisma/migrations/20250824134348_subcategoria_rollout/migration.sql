/*
  Warnings:

  - The primary key for the `rollup_despesas_mensais_categoria` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoria_id` on the `rollup_despesas_mensais_categoria` table. All the data in the column will be lost.
  - Added the required column `sub_categoria_id` to the `rollup_despesas_mensais_categoria` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" DROP CONSTRAINT "rollup_despesas_mensais_categoria_categoria_id_fkey";

-- AlterTable
ALTER TABLE "public"."rollup_despesas_mensais_categoria" DROP CONSTRAINT "rollup_despesas_mensais_categoria_pkey",
DROP COLUMN "categoria_id",
ADD COLUMN     "sub_categoria_id" INTEGER NOT NULL,
ADD CONSTRAINT "rollup_despesas_mensais_categoria_pkey" PRIMARY KEY ("parceiro_id", "ym", "sub_categoria_id");

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_sub_categoria_id_fkey" FOREIGN KEY ("sub_categoria_id") REFERENCES "public"."subcategoria_despesa"("subcategoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;
