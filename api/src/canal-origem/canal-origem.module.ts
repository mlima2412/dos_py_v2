import { Module } from '@nestjs/common';
import { CanalOrigemService } from './canal-origem.service';
import { CanalOrigemController } from './canal-origem.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CanalOrigemController],
  providers: [CanalOrigemService],
  exports: [CanalOrigemService],
})
export class CanalOrigemModule {}
