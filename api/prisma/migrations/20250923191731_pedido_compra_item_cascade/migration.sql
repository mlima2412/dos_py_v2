-- DropForeignKey
ALTER TABLE "public"."pedido_compra_item" DROP CONSTRAINT "pedido_compra_item_pedido_compra_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."pedido_compra_item" ADD CONSTRAINT "pedido_compra_item_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "public"."pedido_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
