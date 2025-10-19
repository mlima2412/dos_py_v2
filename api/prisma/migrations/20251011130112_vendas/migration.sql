-- CreateEnum
CREATE TYPE "public"."VendaTipo" AS ENUM ('DIRETA', 'CONDICIONAL', 'BRINDE');

-- CreateEnum
CREATE TYPE "public"."VendaStatus" AS ENUM ('PEDIDO', 'ABERTA', 'CONFIRMADA', 'CONFIRMADA_PARCIAL', 'CONFIRMADA_TOTAL', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."VendaItemTipo" AS ENUM ('NORMAL', 'BRINDE');

-- CreateEnum
CREATE TYPE "public"."FormaPagamento" AS ENUM ('A_VISTA_IMEDIATA', 'A_PRAZO_SEM_PARCELAS', 'PARCELADO', 'PARCELADO_FLEXIVEL');

-- CreateEnum
CREATE TYPE "public"."ParcelaStatus" AS ENUM ('PENDENTE', 'PAGO', 'PAGO_ATRASADO');

-- CreateTable
CREATE TABLE "public"."pagamento" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "forma" "public"."FormaPagamento" NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "valor_delivery" DECIMAL(12,3),
    "entrada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parcelamento" (
    "id" SERIAL NOT NULL,
    "id_pagamento" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "valor_pago" DOUBLE PRECISION NOT NULL,
    "situacao" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "parcelamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parcelas" (
    "id" SERIAL NOT NULL,
    "parcelamento_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "vencimento" TIMESTAMP(3),
    "recebido_em" TIMESTAMP(3),
    "status" "public"."ParcelaStatus" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."venda" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "local_saida_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "tipo" "public"."VendaTipo" NOT NULL DEFAULT 'DIRETA',
    "status" "public"."VendaStatus" NOT NULL DEFAULT 'PEDIDO',
    "data_venda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_entrega" TIMESTAMP(3),
    "valor_frete" DECIMAL(12,3) DEFAULT 0,
    "valor_total" DECIMAL(12,3) DEFAULT 0,
    "desconto" DECIMAL(12,3) DEFAULT 0,
    "ruccnpj" TEXT,
    "numero_fatura" TEXT,
    "observacao" TEXT,
    "valor_comissao" DECIMAL(12,3) DEFAULT 0,

    CONSTRAINT "venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."venda_item" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "tipo" "public"."VendaItemTipo" NOT NULL DEFAULT 'NORMAL',
    "qtd_reservada" INTEGER NOT NULL,
    "qtd_aceita" INTEGER NOT NULL DEFAULT 0,
    "qtd_devolvida" INTEGER NOT NULL DEFAULT 0,
    "desconto" DECIMAL(12,3) DEFAULT 0,
    "preco_unit" DECIMAL(12,3) NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "venda_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venda_public_id_key" ON "public"."venda"("public_id");

-- AddForeignKey
ALTER TABLE "public"."pagamento" ADD CONSTRAINT "pagamento_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."venda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcelamento" ADD CONSTRAINT "parcelamento_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcelamento" ADD CONSTRAINT "parcelamento_id_pagamento_fkey" FOREIGN KEY ("id_pagamento") REFERENCES "public"."pagamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcelas" ADD CONSTRAINT "parcelas_parcelamento_id_fkey" FOREIGN KEY ("parcelamento_id") REFERENCES "public"."parcelamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda_item" ADD CONSTRAINT "venda_item_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda_item" ADD CONSTRAINT "venda_item_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
