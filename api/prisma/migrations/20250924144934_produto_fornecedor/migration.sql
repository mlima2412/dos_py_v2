-- AlterTable
ALTER TABLE "public"."produto" ADD COLUMN     "fornecedor_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."produto" ADD CONSTRAINT "produto_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
