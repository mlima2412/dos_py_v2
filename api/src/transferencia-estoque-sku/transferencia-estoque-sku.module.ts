import { Module } from '@nestjs/common';
import { TransferenciaEstoqueSkuService } from './transferencia-estoque-sku.service';
import { TransferenciaEstoqueSkuController } from './transferencia-estoque-sku.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransferenciaEstoqueSkuController],
  providers: [TransferenciaEstoqueSkuService],
  exports: [TransferenciaEstoqueSkuService],
})
export class TransferenciaEstoqueSkuModule {}
