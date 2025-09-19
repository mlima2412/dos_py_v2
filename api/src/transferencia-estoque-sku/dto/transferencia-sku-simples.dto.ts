import { ApiProperty } from '@nestjs/swagger';

export class TransferenciaSkuSimplesDto {
  @ApiProperty({ description: 'ID do item da transferência', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome do produto', example: 'Camiseta Polo' })
  produto: string;

  @ApiProperty({ description: 'Preço de venda do produto', example: 29.99 })
  precoVenda: number;

  @ApiProperty({ description: 'Cor do SKU', example: 'Azul' })
  cor: string;

  @ApiProperty({ description: 'Tamanho do SKU', example: 'M' })
  tamanho: string;

  @ApiProperty({ description: 'Quantidade transferida', example: 10 })
  quantidade: number;
}
