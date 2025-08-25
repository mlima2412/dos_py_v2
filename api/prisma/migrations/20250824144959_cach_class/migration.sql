/*
  Warnings:

  - The primary key for the `rollup_despesas_mensais_categoria` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `to_pay` on the `rollup_despesas_mensais_categoria` table. All the data in the column will be lost.
  - Changed the type of `parceiro_id` on the `rollup_despesas_mensais_categoria` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" DROP CONSTRAINT "rollup_despesas_mensais_categoria_parceiro_id_fkey";

-- AlterTable
ALTER TABLE "public"."rollup_despesas_mensais_categoria" DROP CONSTRAINT "rollup_despesas_mensais_categoria_pkey",
DROP COLUMN "to_pay",
DROP COLUMN "parceiro_id",
ADD COLUMN     "parceiro_id" INTEGER NOT NULL,
ADD CONSTRAINT "rollup_despesas_mensais_categoria_pkey" PRIMARY KEY ("parceiro_id", "ym", "sub_categoria_id");

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
