// src/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';
import { DespesasModule } from '../src/despesas/despesas.module';
import { CategoriaDespesasModule } from '../src/categoria-despesas/categoria-despesas.module';
import { SubCategoriaDespesaModule } from '../src/subcategoria-despesa/subcategoria-despesa.module';
import { ClientesModule } from '../src/clientes/clientes.module';
import { ProdutoModule } from '../src/produto/produto.module';
import { ProdutoSkuModule } from '../src/produto-sku/produto-sku.module';
import { EstoqueSkuModule } from '../src/estoque-sku/estoque-sku.module';
import { FornecedoresModule } from '../src/fornecedores/fornecedores.module';
import { PedidoCompraModule } from '../src/pedido-compra/pedido-compra.module';
import { PedidoCompraItemModule } from '../src/pedido-compra-item/pedido-compra-item.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DespesasModule,
    CategoriaDespesasModule,
    SubCategoriaDespesaModule,
    ClientesModule,
    ProdutoModule,
    ProdutoSkuModule,
    EstoqueSkuModule,
    FornecedoresModule,
    PedidoCompraModule,
    PedidoCompraItemModule,
  ],
})
export class SeedModule {}
