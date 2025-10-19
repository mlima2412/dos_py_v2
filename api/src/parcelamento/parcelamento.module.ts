import { Module } from '@nestjs/common';
import { ParcelamentoService } from './parcelamento.service';
import { ParcelamentoController } from './parcelamento.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParcelamentoController],
  providers: [ParcelamentoService],
})
export class ParcelamentoModule {}
