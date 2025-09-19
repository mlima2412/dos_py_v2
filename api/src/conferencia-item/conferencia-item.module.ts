import { Module } from '@nestjs/common';
import { ConferenciaItemService } from './conferencia-item.service';
import { ConferenciaItemController } from './conferencia-item.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConferenciaItemController],
  providers: [ConferenciaItemService],
  exports: [ConferenciaItemService],
})
export class ConferenciaItemModule {}
