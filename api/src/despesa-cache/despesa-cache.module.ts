import { Module } from '@nestjs/common';
import { DespesaCacheService } from './despesa-cache.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DespesaCacheService],
  exports: [DespesaCacheService],
})
export class DespesaCacheModule {}
