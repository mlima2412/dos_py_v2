import { Module } from '@nestjs/common';
import { CategoriaProdutoService } from './categoria-produto.service';
import { CategoriaProdutoController } from './categoria-produto.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriaProdutoController],
  providers: [CategoriaProdutoService],
  exports: [CategoriaProdutoService],
})
export class CategoriaProdutoModule {}
