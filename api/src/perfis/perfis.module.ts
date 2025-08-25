import { Module } from '@nestjs/common';
import { PerfisService } from './perfis.service';
import { PerfisController } from './perfis.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PerfisController],
  providers: [PerfisService],
  exports: [PerfisService],
})
export class PerfisModule {}
