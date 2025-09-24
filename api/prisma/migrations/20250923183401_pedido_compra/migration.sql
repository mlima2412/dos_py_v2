-- AlterTable
ALTER TABLE "public"."movimento_estoque" ADD COLUMN     "pedidoCompraId" INTEGER;

-- CreateTable
CREATE TABLE "public"."pedido_compra" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "local_entrada_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_entrega" TIMESTAMP(3),
    "data_pagamento" TIMESTAMP(3),
    "valor_frete" DECIMAL(12,3) DEFAULT 0,
    "valor_total" DECIMAL(12,3) DEFAULT 0,
    "observacao" TEXT,
    "valor_comissao" DECIMAL(12,3) DEFAULT 0,
    "cotacao" DOUBLE PRECISION DEFAULT 1,
    "currency_id" INTEGER,
    "consignado" BOOLEAN NOT NULL DEFAULT false,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pedido_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pedido_compra_item" (
    "id" SERIAL NOT NULL,
    "pedido_compra_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "qtd" INTEGER NOT NULL,
    "preco_compra" DECIMAL(12,3) NOT NULL,
    "preco_venda" DECIMAL(12,3) NOT NULL,
    "desconto" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "observacao" TEXT,

    CONSTRAINT "pedido_compra_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedido_compra_public_id_key" ON "public"."pedido_compra"("public_id");

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_pedidoCompraId_fkey" FOREIGN KEY ("pedidoCompraId") REFERENCES "public"."pedido_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_local_entrada_id_fkey" FOREIGN KEY ("local_entrada_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra_item" ADD CONSTRAINT "pedido_compra_item_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "public"."pedido_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra_item" ADD CONSTRAINT "pedido_compra_item_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
