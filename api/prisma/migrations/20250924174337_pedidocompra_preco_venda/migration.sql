/*
  Warnings:

  - You are about to drop the column `desconto` on the `pedido_compra_item` table. All the data in the column will be lost.
  - You are about to drop the column `preco_venda` on the `pedido_compra_item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."pedido_compra_item" DROP COLUMN "desconto",
DROP COLUMN "preco_venda";
