-- AlterTable
ALTER TABLE "public"."contas_a_pagar_parcelas" ADD COLUMN     "currency_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" ADD CONSTRAINT "contas_a_pagar_parcelas_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
