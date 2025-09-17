-- CreateEnum
CREATE TYPE "public"."TipoMovimento" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'CONDICIONAL', 'DEVOLUCAO', 'AJUSTE');

-- CreateTable
CREATE TABLE "public"."movimento_estoque" (
    "id" SERIAL NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "tipo" "public"."TipoMovimento" NOT NULL DEFAULT 'ENTRADA',
    "qtd" INTEGER NOT NULL DEFAULT 1,
    "data_movimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "local_origem_id" INTEGER,
    "local_destino_id" INTEGER,
    "observacao" TEXT,

    CONSTRAINT "movimento_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimento_estoque_sku_id_idx" ON "public"."movimento_estoque"("sku_id");

-- CreateIndex
CREATE INDEX "movimento_estoque_local_origem_id_idx" ON "public"."movimento_estoque"("local_origem_id");

-- CreateIndex
CREATE INDEX "movimento_estoque_local_destino_id_idx" ON "public"."movimento_estoque"("local_destino_id");

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_local_origem_id_fkey" FOREIGN KEY ("local_origem_id") REFERENCES "public"."local_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_local_destino_id_fkey" FOREIGN KEY ("local_destino_id") REFERENCES "public"."local_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;
