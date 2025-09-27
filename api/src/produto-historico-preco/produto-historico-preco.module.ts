import { Module } from '@nestjs/common';
import { ProdutoHistoricoPrecoService } from './produto-historico-preco.service';
import { ProdutoHistoricoPrecoController } from './produto-historico-preco.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProdutoHistoricoPrecoController],
  providers: [ProdutoHistoricoPrecoService],
  exports: [ProdutoHistoricoPrecoService],
})
export class ProdutoHistoricoPrecoModule {}
