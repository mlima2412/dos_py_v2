/*
  Warnings:

  - The primary key for the `rollup_despesas_mensais` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `parceiro_id` on the `rollup_despesas_mensais` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."rollup_despesas_mensais" DROP CONSTRAINT "rollup_despesas_mensais_parceiro_id_fkey";

-- AlterTable
ALTER TABLE "public"."rollup_despesas_mensais" DROP CONSTRAINT "rollup_despesas_mensais_pkey",
DROP COLUMN "parceiro_id",
ADD COLUMN     "parceiro_id" INTEGER NOT NULL,
ADD CONSTRAINT "rollup_despesas_mensais_pkey" PRIMARY KEY ("parceiro_id", "ym");

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais" ADD CONSTRAINT "rollup_despesas_mensais_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
