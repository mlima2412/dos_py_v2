import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferenciaEstoque {
  @ApiProperty({ description: 'ID da transferência', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID da transferência', example: 'transfer_123456789' })
  publicId: string;

  @ApiProperty({ description: 'ID do local de origem', example: 1 })
  localOrigemId: number;

  @ApiProperty({ description: 'ID do local de destino', example: 2 })
  localDestinoId: number;

  @ApiProperty({ description: 'ID do usuário que enviou', example: 1 })
  enviadoPorUsuarioId: number;

  @ApiPropertyOptional({ description: 'ID do usuário que recebeu', example: 2 })
  recebidoPorUsuarioId?: number;

  @ApiProperty({ description: 'Quantidade total de itens', example: 25 })
  qtd: number;

  @ApiProperty({ 
    description: 'Valor total da transferência', 
    example: 1500.50,
    type: 'number',
    format: 'decimal'
  })
  valorTotal: number;

  @ApiProperty({ description: 'Data da transferência', example: '2024-01-15T10:30:00Z' })
  dataTransferencia: Date;

  @ApiPropertyOptional({ description: 'Data do recebimento', example: '2024-01-15T14:30:00Z' })
  dataRecebimento?: Date;
}