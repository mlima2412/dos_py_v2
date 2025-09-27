-- CreateTable
CREATE TABLE "public"."produto_historico_preco" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "preco" DECIMAL(12,3) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produto_historico_preco_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."produto_historico_preco" ADD CONSTRAINT "produto_historico_preco_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
