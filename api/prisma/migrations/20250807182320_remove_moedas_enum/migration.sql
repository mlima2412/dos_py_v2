/*
  Warnings:

  - You are about to drop the column `moeda_principal` on the `cliente` table. All the data in the column will be lost.
  - You are about to drop the column `moeda` on the `contas_a_pagar` table. All the data in the column will be lost.
  - You are about to drop the column `moeda` on the `contas_a_pagar_parcelas` table. All the data in the column will be lost.
  - You are about to drop the column `moeda_despesa` on the `despesa` table. All the data in the column will be lost.
  - You are about to drop the column `moeda` on the `despesa_recorrente` table. All the data in the column will be lost.
  - You are about to drop the column `moeda_principal` on the `fornecedor` table. All the data in the column will be lost.
  - You are about to drop the column `moeda_principal` on the `parceiro` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."parceiro" DROP CONSTRAINT "parceiro_currency_id_fkey";

-- AlterTable
ALTER TABLE "public"."cliente" DROP COLUMN "moeda_principal";

-- AlterTable
ALTER TABLE "public"."contas_a_pagar" DROP COLUMN "moeda",
ADD COLUMN     "currency_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."contas_a_pagar_parcelas" DROP COLUMN "moeda",
ADD COLUMN     "currency_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."despesa" DROP COLUMN "moeda_despesa",
ADD COLUMN     "currency_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."despesa_recorrente" DROP COLUMN "moeda",
ADD COLUMN     "currency_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."fornecedor" DROP COLUMN "moeda_principal";

-- AlterTable
ALTER TABLE "public"."parceiro" DROP COLUMN "moeda_principal",
ALTER COLUMN "currency_id" DROP NOT NULL,
ALTER COLUMN "currency_id" DROP DEFAULT;

-- DropEnum
DROP TYPE "public"."Moedas";

-- AddForeignKey
ALTER TABLE "public"."parceiro" ADD CONSTRAINT "parceiro_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar" ADD CONSTRAINT "contas_a_pagar_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" ADD CONSTRAINT "contas_a_pagar_parcelas_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
