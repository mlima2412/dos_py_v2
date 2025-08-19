/*
  Warnings:

  - You are about to drop the column `cotacao` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `currency_id` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `data_pagamento` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `origem_id` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `origem_tipo` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `parceiro_id` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `cotacao` on the `contas_a_pagar_parcelas` table. All the data in the column will be lost.
  - You are about to drop the column `currency_id` on the `contas_a_pagar_parcelas` table. All the data in the column will be lost.
  - You are about to drop the column `data_despesa` on the `despesa` table. All the data in the column will be lost.
  - You are about to drop the column `data_pagamento` on the `despesa` table. All the data in the column will be lost.
  - You are about to drop the column `data_vencimento` on the `despesa` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `despesa` table. All the data in the column will be lost.
  - Added the required column `data_vencimento` to the `contas_a_pagar_parcelas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."contas_a_pagar" DROP CONSTRAINT "contas_a_pagar_currency_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contas_a_pagar" DROP CONSTRAINT "contas_a_pagar_parceiro_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" DROP CONSTRAINT "contas_a_pagar_parcelas_currency_id_fkey";

-- AlterTable
ALTER TABLE "public"."contas_a_pagar" DROP COLUMN "cotacao",
DROP COLUMN "currency_id",
DROP COLUMN "data_pagamento",
DROP COLUMN "descricao",
DROP COLUMN "origem_id",
DROP COLUMN "origem_tipo",
DROP COLUMN "parceiro_id",
ADD COLUMN     "despesa_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."contas_a_pagar_parcelas" DROP COLUMN "cotacao",
DROP COLUMN "currency_id",
ADD COLUMN     "data_vencimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pago" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."despesa" DROP COLUMN "data_despesa",
DROP COLUMN "data_pagamento",
DROP COLUMN "data_vencimento",
DROP COLUMN "valor",
ADD COLUMN     "data_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar" ADD CONSTRAINT "contas_a_pagar_despesa_id_fkey" FOREIGN KEY ("despesa_id") REFERENCES "public"."despesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
