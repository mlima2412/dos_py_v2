-- CreateTable
CREATE TABLE "public"."rollup_despesas_mensais" (
    "parceiro_id" TEXT NOT NULL,
    "ym" TEXT NOT NULL,
    "realized" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "to_pay" DECIMAL(12,3) NOT NULL DEFAULT 0.0,

    CONSTRAINT "rollup_despesas_mensais_pkey" PRIMARY KEY ("parceiro_id","ym")
);

-- CreateTable
CREATE TABLE "public"."rollup_despesas_mensais_categoria" (
    "parceiro_id" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "ym" TEXT NOT NULL,
    "realized" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "to_pay" DECIMAL(12,3) NOT NULL DEFAULT 0.0,

    CONSTRAINT "rollup_despesas_mensais_categoria_pkey" PRIMARY KEY ("parceiro_id","ym","categoria_id")
);

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais" ADD CONSTRAINT "rollup_despesas_mensais_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("public_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("public_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria_despesas"("categoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;
