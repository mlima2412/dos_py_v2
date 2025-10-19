-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_local_saida_id_fkey" FOREIGN KEY ("local_saida_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
