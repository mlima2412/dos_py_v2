import { Module } from '@nestjs/common';
import { ConferenciaEstoqueService } from './conferencia-estoque.service';
import { ConferenciaEstoqueController } from './conferencia-estoque.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConferenciaEstoqueController],
  providers: [ConferenciaEstoqueService],
  exports: [ConferenciaEstoqueService],
})
export class ConferenciaEstoqueModule {}
