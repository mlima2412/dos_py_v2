import { ApiProperty } from '@nestjs/swagger';

export class Perfil {
  @ApiProperty({
    description: 'ID interno do perfil',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do perfil',
    example: 'Administrador',
  })
  nome: string;

  @ApiProperty({
    description: 'Status ativo do perfil',
    example: true,
    default: true,
  })
  ativo: boolean;

  constructor(data?: Partial<Perfil>) {
    if (data) {
      Object.assign(this, data);
    }

    // Definir valor padrão para ativo
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<Perfil>): Perfil {
    return new Perfil(data);
  }
}
