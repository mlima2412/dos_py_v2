-- CreateTable
CREATE TABLE "public"."transferencia_estoque" (
    "id" SERIAL NOT NULL,
    "local_origem_id" INTEGER NOT NULL,
    "local_destino_id" INTEGER NOT NULL,
    "enviado_por_usuario_id" INTEGER NOT NULL,
    "recebido_por_usuario_id" INTEGER,
    "qtd" INTEGER NOT NULL DEFAULT 1,
    "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "data_transferencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_recebimento" TIMESTAMP(3),

    CONSTRAINT "transferencia_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transferencia_estoque_item" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "movimento_estoque_id" INTEGER NOT NULL,

    CONSTRAINT "transferencia_estoque_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transferencia_estoque_local_origem_id_idx" ON "public"."transferencia_estoque"("local_origem_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_local_destino_id_idx" ON "public"."transferencia_estoque"("local_destino_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_enviado_por_usuario_id_idx" ON "public"."transferencia_estoque"("enviado_por_usuario_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_recebido_por_usuario_id_idx" ON "public"."transferencia_estoque"("recebido_por_usuario_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_item_transferencia_id_idx" ON "public"."transferencia_estoque_item"("transferencia_id");

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_enviado_por_usuario_id_fkey" FOREIGN KEY ("enviado_por_usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_recebido_por_usuario_id_fkey" FOREIGN KEY ("recebido_por_usuario_id") REFERENCES "public"."usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_local_origem_id_fkey" FOREIGN KEY ("local_origem_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_local_destino_id_fkey" FOREIGN KEY ("local_destino_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque_item" ADD CONSTRAINT "transferencia_estoque_item_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "public"."transferencia_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque_item" ADD CONSTRAINT "transferencia_estoque_item_movimento_estoque_id_fkey" FOREIGN KEY ("movimento_estoque_id") REFERENCES "public"."movimento_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
