-- DropForeignKey
ALTER TABLE "public"."conferencia_item" DROP CONSTRAINT "conferencia_item_conferencia_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."conferencia_item" ADD CONSTRAINT "conferencia_item_conferencia_id_fkey" FOREIGN KEY ("conferencia_id") REFERENCES "public"."conferencia_estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;
