import { Module } from '@nestjs/common';
import { VendaItemService } from './venda-item.service';
import { VendaItemController } from './venda-item.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VendaItemController],
  providers: [VendaItemService],
})
export class VendaItemModule {}
