import { Module } from '@nestjs/common';
import { ImpostoService } from './imposto.service';
import { ImpostoController } from './imposto.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImpostoController],
  providers: [ImpostoService],
  exports: [ImpostoService],
})
export class ImpostoModule {}
