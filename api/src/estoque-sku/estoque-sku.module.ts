import { Module } from '@nestjs/common';
import { EstoqueSkuService } from './estoque-sku.service';
import { EstoqueSkuController } from './estoque-sku.controller';

@Module({
  controllers: [EstoqueSkuController],
  providers: [EstoqueSkuService],
})
export class EstoqueSkuModule {}
