-- CreateEnum
CREATE TYPE "public"."TipoPagamento" AS ENUM ('A_VISTA_IMEDIATA', 'A_PRAZO_SEM_PARCELAS', 'PARCELADO');

-- AlterTable
ALTER TABLE "public"."despesa" ADD COLUMN     "tipo_pagamento" "public"."TipoPagamento" NOT NULL DEFAULT 'A_VISTA_IMEDIATA';
