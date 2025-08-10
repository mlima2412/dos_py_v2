-- CreateEnum
CREATE TYPE "public"."FrequenciaEnum" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateTable
CREATE TABLE "public"."categoria_despesas" (
    "categoria_id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categoria_despesas_pkey" PRIMARY KEY ("categoria_id")
);

-- CreateTable
CREATE TABLE "public"."subcategoria_despesa" (
    "subcategoria_id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcategoria_despesa_pkey" PRIMARY KEY ("subcategoria_id")
);

-- CreateTable
CREATE TABLE "public"."despesa" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "data_despesa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "descricao" TEXT NOT NULL,
    "sub_categoria_id" INTEGER NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER,
    "data_vencimento" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "data_pagamento" TIMESTAMP(3),
    "moeda_despesa" "public"."Moedas" DEFAULT 'Real',
    "cotacao" DECIMAL(12,3) DEFAULT 0.0,

    CONSTRAINT "despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."despesa_recorrente" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "frequencia" "public"."FrequenciaEnum" NOT NULL DEFAULT 'MENSAL',
    "dia_vencimento" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "sub_categoria_id" INTEGER NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER,
    "moeda" "public"."Moedas",
    "cotacao" DECIMAL(12,3) DEFAULT 0.0,

    CONSTRAINT "despesa_recorrente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "despesa_public_id_key" ON "public"."despesa"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "despesa_recorrente_public_id_key" ON "public"."despesa_recorrente"("public_id");

-- AddForeignKey
ALTER TABLE "public"."subcategoria_despesa" ADD CONSTRAINT "subcategoria_despesa_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria_despesas"("categoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_sub_categoria_id_fkey" FOREIGN KEY ("sub_categoria_id") REFERENCES "public"."subcategoria_despesa"("subcategoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_sub_categoria_id_fkey" FOREIGN KEY ("sub_categoria_id") REFERENCES "public"."subcategoria_despesa"("subcategoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;
