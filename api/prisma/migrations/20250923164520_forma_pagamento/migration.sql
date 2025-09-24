-- CreateTable
CREATE TABLE "public"."forma_pagamento" (
    "idFormaPag" SERIAL NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "taxa" DECIMAL(12,3) DEFAULT 0,
    "tempo_liberacao" INTEGER NOT NULL DEFAULT 0,
    "imposto_pos_calculo" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "forma_pagamento_pkey" PRIMARY KEY ("idFormaPag")
);

-- AddForeignKey
ALTER TABLE "public"."forma_pagamento" ADD CONSTRAINT "forma_pagamento_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
