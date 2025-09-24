-- AlterTable
ALTER TABLE "public"."produto" ADD COLUMN     "currency_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."produto" ADD CONSTRAINT "produto_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
