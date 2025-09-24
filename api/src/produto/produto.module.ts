import { Module } from '@nestjs/common';
import { ProdutoService } from './produto.service';
import { ProdutoController } from './produto.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FornecedoresModule } from '../fornecedores/fornecedores.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [PrismaModule, FornecedoresModule, CurrencyModule],
  controllers: [ProdutoController],
  providers: [ProdutoService],
  exports: [ProdutoService],
})
export class ProdutoModule {}
