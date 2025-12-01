import { Module } from '@nestjs/common';
import { GrupoDreService } from './grupo-dre.service';
import { GrupoDreController } from './grupo-dre.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GrupoDreController],
  providers: [GrupoDreService],
  exports: [GrupoDreService],
})
export class GrupoDreModule {}
