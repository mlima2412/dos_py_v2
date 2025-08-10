/*
  Warnings:

  - A unique constraint covering the columns `[currency_id]` on the table `parceiro` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currency_id` to the `parceiro` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "public"."currency" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "prefixo" TEXT NOT NULL,
    "iso_code" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 2,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "default_rate" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "currency_public_id_key" ON "public"."currency"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "currency_iso_code_key" ON "public"."currency"("iso_code");

-- Insert default currency (Guarani Paraguaio)
INSERT INTO "public"."currency" ("public_id", "nome", "prefixo", "iso_code", "precision", "locale", "default_rate", "ativo") 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Guarani Paraguaio', 'PYG', 'PYG', 0, 'es-PY', 1.0, true);

-- AlterTable - Add currency_id column with default value pointing to the default currency
ALTER TABLE "public"."parceiro" ADD COLUMN "currency_id" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "parceiro_currency_id_key" ON "public"."parceiro"("currency_id");

-- AddForeignKey
ALTER TABLE "public"."parceiro" ADD CONSTRAINT "parceiro_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
