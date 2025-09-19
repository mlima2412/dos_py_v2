-- CreateTable
CREATE TABLE "public"."conferencia_estoque" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "local_estoque_id" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "usuario_responsavel_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "conferencia_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conferencia_item" (
    "id" SERIAL NOT NULL,
    "conferencia_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "qtd_sistema" INTEGER NOT NULL DEFAULT 0,
    "qtd_conferencia" INTEGER NOT NULL DEFAULT 0,
    "diferenca" INTEGER NOT NULL DEFAULT 0,
    "ajustado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conferencia_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conferencia_estoque_public_id_key" ON "public"."conferencia_estoque"("public_id");

-- AddForeignKey
ALTER TABLE "public"."conferencia_estoque" ADD CONSTRAINT "conferencia_estoque_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_estoque" ADD CONSTRAINT "conferencia_estoque_usuario_responsavel_id_fkey" FOREIGN KEY ("usuario_responsavel_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_estoque" ADD CONSTRAINT "conferencia_estoque_local_estoque_id_fkey" FOREIGN KEY ("local_estoque_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_item" ADD CONSTRAINT "conferencia_item_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_item" ADD CONSTRAINT "conferencia_item_conferencia_id_fkey" FOREIGN KEY ("conferencia_id") REFERENCES "public"."conferencia_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
