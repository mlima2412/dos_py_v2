-- DropForeignKey
ALTER TABLE "public"."produto_sku" DROP CONSTRAINT "produto_sku_produto_id_fkey";

-- AlterTable
ALTER TABLE "public"."produto" ALTER COLUMN "preco_compra" DROP NOT NULL,
ALTER COLUMN "preco_compra" SET DEFAULT 0.0;

-- CreateTable
CREATE TABLE "public"."local_estoque" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,

    CONSTRAINT "local_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estoque_sku" (
    "sku_id" INTEGER NOT NULL,
    "local_id" INTEGER NOT NULL,
    "qtd" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estoque_sku_pkey" PRIMARY KEY ("local_id","sku_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "local_estoque_public_id_key" ON "public"."local_estoque"("public_id");

-- CreateIndex
CREATE INDEX "local_estoque_parceiro_id_idx" ON "public"."local_estoque"("parceiro_id");

-- AddForeignKey
ALTER TABLE "public"."produto_sku" ADD CONSTRAINT "produto_sku_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."local_estoque" ADD CONSTRAINT "local_estoque_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estoque_sku" ADD CONSTRAINT "estoque_sku_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estoque_sku" ADD CONSTRAINT "estoque_sku_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
