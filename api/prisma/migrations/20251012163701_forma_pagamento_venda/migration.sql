/*
  Warnings:

  - You are about to drop the column `forma` on the `pagamento` table. All the data in the column will be lost.
  - Added the required column `forma_pagamento_id` to the `pagamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `pagamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_forma_pag` to the `parcelamento` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TipoVenda" AS ENUM ('A_VISTA_IMEDIATA', 'A_PRAZO_SEM_PARCELAS', 'PARCELADO', 'PARCELADO_FLEXIVEL');

-- AlterTable
ALTER TABLE "public"."pagamento" DROP COLUMN "forma",
ADD COLUMN     "forma_pagamento_id" INTEGER NOT NULL,
ADD COLUMN     "tipo" "public"."TipoVenda" NOT NULL;

-- AlterTable
ALTER TABLE "public"."parcelamento" ADD COLUMN     "id_forma_pag" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "public"."FormaPagamento";

-- AddForeignKey
ALTER TABLE "public"."pagamento" ADD CONSTRAINT "pagamento_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "public"."forma_pagamento"("idFormaPag") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcelamento" ADD CONSTRAINT "parcelamento_id_forma_pag_fkey" FOREIGN KEY ("id_forma_pag") REFERENCES "public"."forma_pagamento"("idFormaPag") ON DELETE RESTRICT ON UPDATE CASCADE;
