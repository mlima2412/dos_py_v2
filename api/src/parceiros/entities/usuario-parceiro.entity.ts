import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Parceiro } from './parceiro.entity';
import { Perfil } from '../../perfis/entities/perfil.entity';

export class UsuarioParceiro {
  @ApiProperty({
    description: 'ID único da relação usuário-parceiro',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID do usuário',
    example: 1,
  })
  usuarioId: number;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'ID do perfil',
    example: 1,
  })
  perfilId: number;

  @ApiProperty({
    description: 'Data de criação da relação',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Dados do usuário relacionado',
    type: () => Usuario,
    required: false,
  })
  Usuario?: Usuario;

  @ApiProperty({
    description: 'Dados do parceiro relacionado',
    type: () => Parceiro,
    required: false,
  })
  Parceiro?: Parceiro;

  @ApiProperty({
    description: 'Dados do perfil relacionado',
    type: () => Perfil,
    required: false,
  })
  perfil?: Perfil;

  constructor(data?: Partial<UsuarioParceiro>) {
    if (data) {
      Object.assign(this, data);
    }
    this.createdAt = this.createdAt || new Date();
  }

  static create(data: Partial<UsuarioParceiro>): UsuarioParceiro {
    return new UsuarioParceiro(data);
  }
}
