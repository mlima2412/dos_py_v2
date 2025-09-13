import { Module } from '@nestjs/common';
import { ProdutoSkuService } from './produto-sku.service';
import { ProdutoSkuController } from './produto-sku.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProdutoSkuController],
  providers: [ProdutoSkuService],
  exports: [ProdutoSkuService],
})
export class ProdutoSkuModule {}
