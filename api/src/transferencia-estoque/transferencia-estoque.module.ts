import { Module } from '@nestjs/common';
import { TransferenciaEstoqueService } from './transferencia-estoque.service';
import { TransferenciaEstoqueController } from './transferencia-estoque.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MovimentoEstoqueModule } from '../movimento-estoque/movimento-estoque.module';

@Module({
  imports: [PrismaModule, MovimentoEstoqueModule],
  controllers: [TransferenciaEstoqueController],
  providers: [TransferenciaEstoqueService],
  exports: [TransferenciaEstoqueService],
})
export class TransferenciaEstoqueModule {}
