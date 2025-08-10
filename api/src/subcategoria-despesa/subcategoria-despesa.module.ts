import { Module } from '@nestjs/common';
import { SubCategoriaDespesaService } from './subcategoria-despesa.service';
import { SubCategoriaDespesaController } from './subcategoria-despesa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubCategoriaDespesaController],
  providers: [SubCategoriaDespesaService],
  exports: [SubCategoriaDespesaService],
})
export class SubCategoriaDespesaModule {}