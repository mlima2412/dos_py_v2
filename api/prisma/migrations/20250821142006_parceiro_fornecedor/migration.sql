/*
  Warnings:

  - Added the required column `parceiro_id` to the `fornecedor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."fornecedor" ADD COLUMN     "parceiro_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."fornecedor" ADD CONSTRAINT "fornecedor_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
