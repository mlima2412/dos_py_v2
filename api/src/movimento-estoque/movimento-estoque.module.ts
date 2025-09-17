import { Module } from '@nestjs/common';
import { MovimentoEstoqueService } from './movimento-estoque.service';
import { MovimentoEstoqueController } from './movimento-estoque.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MovimentoEstoqueController],
  providers: [MovimentoEstoqueService],
  exports: [MovimentoEstoqueService],
})
export class MovimentoEstoqueModule {}
