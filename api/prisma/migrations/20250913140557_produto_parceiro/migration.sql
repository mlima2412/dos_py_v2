/*
  Warnings:

  - You are about to drop the column `qtd` on the `produto_sku` table. All the data in the column will be lost.
  - Added the required column `parceiro_id` to the `produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."produto" ADD COLUMN     "parceiro_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."produto_sku" DROP COLUMN "qtd";

-- AddForeignKey
ALTER TABLE "public"."produto" ADD CONSTRAINT "produto_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
