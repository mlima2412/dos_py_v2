import { Module } from '@nestjs/common';
import { RegraLancamentoService } from './regra-lancamento.service';
import { RegraLancamentoController } from './regra-lancamento.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RegraLancamentoController],
  providers: [RegraLancamentoService],
  exports: [RegraLancamentoService],
})
export class RegraLancamentoModule {}
