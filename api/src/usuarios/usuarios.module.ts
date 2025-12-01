import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PasswordResetModule } from '../password-reset/password-reset.module';

@Module({
  imports: [PrismaModule, PasswordResetModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
