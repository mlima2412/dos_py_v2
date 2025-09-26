import { ApiProperty } from '@nestjs/swagger';

export class PerfilDto {
  @ApiProperty({
    description: 'ID do perfil',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do perfil',
    example: 'Administrador',
  })
  nome: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do usuário',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  nome: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@exemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Telefone do usuário',
    example: '+5511999999999',
    required: false,
  })
  telefone?: string;

  @ApiProperty({
    description: 'URL do avatar do usuário',
    example: 'https://exemplo.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'Perfil do usuário',
    type: PerfilDto,
    required: false,
  })
  perfil?: PerfilDto;
}
