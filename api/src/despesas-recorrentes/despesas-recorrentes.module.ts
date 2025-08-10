import { Module } from '@nestjs/common';
import { DespesasRecorrentesService } from './despesas-recorrentes.service';
import { DespesasRecorrentesController } from './despesas-recorrentes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DespesasRecorrentesController],
  providers: [DespesasRecorrentesService],
  exports: [DespesasRecorrentesService],
})
export class DespesasRecorrentesModule {}