import { Module } from '@nestjs/common';
import { ParceirosService } from './parceiros.service';
import { ParceirosController } from './parceiros.controller';
import { UsuarioParceiroService } from './usuario-parceiro.service';
import { UsuarioParceiroController } from './usuario-parceiro.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParceirosController, UsuarioParceiroController],
  providers: [ParceirosService, UsuarioParceiroService],
  exports: [ParceirosService, UsuarioParceiroService],
})
export class ParceirosModule {}
