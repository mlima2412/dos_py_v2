-- CreateTable
CREATE TABLE "public"."contas_a_pagar" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "origem_tipo" TEXT NOT NULL,
    "origem_id" INTEGER NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "saldo" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "descricao" TEXT NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "moeda" "public"."Moedas",
    "cotacao" DECIMAL(12,3) DEFAULT 0.0,
    "data_pagamento" TIMESTAMP(3),

    CONSTRAINT "contas_a_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contas_a_pagar_parcelas" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "data_pagamento" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "moeda" "public"."Moedas",
    "cotacao" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "contas_pagar_id" INTEGER NOT NULL,

    CONSTRAINT "contas_a_pagar_parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contas_a_pagar_public_id_key" ON "public"."contas_a_pagar"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "contas_a_pagar_parcelas_public_id_key" ON "public"."contas_a_pagar_parcelas"("public_id");

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar" ADD CONSTRAINT "contas_a_pagar_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" ADD CONSTRAINT "contas_a_pagar_parcelas_contas_pagar_id_fkey" FOREIGN KEY ("contas_pagar_id") REFERENCES "public"."contas_a_pagar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
