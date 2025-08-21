// src/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module'
import { DespesasModule } from '../src/despesas/despesas.module';
import { CategoriaDespesasModule } from '../src/categoria-despesas/categoria-despesas.module'
import { SubCategoriaDespesaModule } from '../src/subcategoria-despesa/subcategoria-despesa.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DespesasModule,
    CategoriaDespesasModule,
    SubCategoriaDespesaModule,
  ],
})
export class SeedModule {}
