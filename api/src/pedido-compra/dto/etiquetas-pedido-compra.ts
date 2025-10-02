// Crie este dto com os seguintes campos: id_produto, nome, id_sku, cor, tamanho, preco
// com as devidas tipagens e documentação swagger

import { ApiProperty } from '@nestjs/swagger';

export class EtiquetaPedidoCompraDto {
  @ApiProperty({ description: 'Nome do produto' })
  nome: string;

  @ApiProperty({ description: 'ID do produto' })
  id_produto: number;

  @ApiProperty({ description: 'ID do SKU do produto' })
  id_sku: number;

  @ApiProperty({ description: 'Cor do produto', required: false })
  cor?: string;

  @ApiProperty({ description: 'Tamanho do produto', required: false })
  tamanho?: string;

  @ApiProperty({ description: 'Preço do produto' })
  preco: number;
}
