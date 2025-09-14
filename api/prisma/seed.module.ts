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
  ],
})
export class SeedModule {}
