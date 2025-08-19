/*
  Warnings:

  - You are about to drop the column `data_vencimento` on the `contas_a_pagar` table. All the data in the column will be lost.
  - Added the required column `data_criacao` to the `contas_a_pagar` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."contas_a_pagar" DROP CONSTRAINT "contas_a_pagar_despesa_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" DROP CONSTRAINT "contas_a_pagar_parcelas_contas_pagar_id_fkey";

-- AlterTable
ALTER TABLE "public"."contas_a_pagar" DROP COLUMN "data_vencimento",
ADD COLUMN     "data_criacao" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."contas_a_pagar_parcelas" ALTER COLUMN "data_pagamento" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar" ADD CONSTRAINT "contas_a_pagar_despesa_id_fkey" FOREIGN KEY ("despesa_id") REFERENCES "public"."despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" ADD CONSTRAINT "contas_a_pagar_parcelas_contas_pagar_id_fkey" FOREIGN KEY ("contas_pagar_id") REFERENCES "public"."contas_a_pagar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
