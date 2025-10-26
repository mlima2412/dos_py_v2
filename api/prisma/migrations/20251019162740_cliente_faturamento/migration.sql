/*
  Warnings:

  - You are about to drop the column `nome_fatura` on the `cliente` table. All the data in the column will be lost.
  - You are about to drop the column `ruccnpj_secundario` on the `cliente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."cliente" DROP COLUMN "nome_fatura",
DROP COLUMN "ruccnpj_secundario";

-- AlterTable
ALTER TABLE "public"."venda" ADD COLUMN     "nome_fatura" TEXT;
