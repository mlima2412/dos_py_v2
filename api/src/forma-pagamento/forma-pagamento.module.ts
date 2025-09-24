import { Module } from '@nestjs/common';
import { FormaPagamentoService } from './forma-pagamento.service';
import { FormaPagamentoController } from './forma-pagamento.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FormaPagamentoController],
  providers: [FormaPagamentoService, PrismaService],
  exports: [FormaPagamentoService],
})
export class FormaPagamentoModule {}
