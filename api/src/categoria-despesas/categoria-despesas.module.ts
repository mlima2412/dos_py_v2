import { Module } from '@nestjs/common';
import { CategoriaDespesasService } from './categoria-despesas.service';
import { CategoriaDespesasController } from './categoria-despesas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriaDespesasController],
  providers: [CategoriaDespesasService],
  exports: [CategoriaDespesasService],
})
export class CategoriaDespesasModule {}