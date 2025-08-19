-- AlterTable
ALTER TABLE "public"."contas_a_pagar" ADD COLUMN     "data_pagamento" TIMESTAMP(3),
ALTER COLUMN "data_criacao" SET DEFAULT CURRENT_TIMESTAMP;
