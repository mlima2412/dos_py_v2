import { ApiProperty } from '@nestjs/swagger';

export class TransferenciaEstoqueSku {
  @ApiProperty({ description: 'ID do item da transferência', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID da transferência de estoque', example: 1 })
  transferenciaId: number;

  @ApiProperty({ description: 'ID do movimento de estoque', example: 1 })
  movimentoEstoqueId: number;
}