import { Module } from '@nestjs/common';
import { ContaDreService } from './conta-dre.service';
import { ContaDreController } from './conta-dre.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContaDreController],
  providers: [ContaDreService],
  exports: [ContaDreService],
})
export class ContaDreModule {}
