import { Module } from '@nestjs/common';
import { LancamentoDreService } from './lancamento-dre.service';
import { LancamentoDreController } from './lancamento-dre.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LancamentoDreController],
  providers: [LancamentoDreService],
  exports: [LancamentoDreService],
})
export class LancamentoDreModule {}
