/*
  Warnings:

  - The primary key for the `rollup_despesas_mensais_categoria` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."rollup_despesas_mensais_categoria" DROP CONSTRAINT "rollup_despesas_mensais_categoria_pkey",
ADD CONSTRAINT "rollup_despesas_mensais_categoria_pkey" PRIMARY KEY ("parceiro_id", "ym", "categoria_id", "sub_categoria_id");
