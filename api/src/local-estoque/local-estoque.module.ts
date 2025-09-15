import { Module } from '@nestjs/common';
import { LocalEstoqueService } from './local-estoque.service';
import { LocalEstoqueController } from './local-estoque.controller';

@Module({
  controllers: [LocalEstoqueController],
  providers: [LocalEstoqueService],
})
export class LocalEstoqueModule {}
