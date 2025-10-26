-- CreateIndex
CREATE INDEX "venda_parceiro_id_cliente_id_idx" ON "public"."venda"("parceiro_id", "cliente_id");
