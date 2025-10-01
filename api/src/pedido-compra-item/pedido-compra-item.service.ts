import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreatePedidoCompraItemDto } from './dto/create-pedido-compra-item.dto';
import { UpdatePedidoCompraItemDto } from './dto/update-pedido-compra-item.dto';
import { PedidoCompraItem } from './entities/pedido-compra-item.entity';

@Injectable()
export class PedidoCompraItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createPedidoCompraItemDto: CreatePedidoCompraItemDto,
    parceiroId: number,
  ): Promise<PedidoCompraItem> {
    try {
      // Verificar se o pedido de compra existe e pertence ao parceiro
      const pedidoCompra = await this.prisma.pedidoCompra.findFirst({
        where: {
          id: createPedidoCompraItemDto.pedidoCompraId,
          parceiroId: parceiroId,
        },
      });

      if (!pedidoCompra) {
        throw new NotFoundException(
          'Pedido de compra não encontrado ou não pertence ao parceiro',
        );
      }

      // Verificar se o pedido não está finalizado
      if (pedidoCompra.status === 3) {
        // FINALIZADO
        throw new ConflictException(
          'Não é possível adicionar itens a um pedido finalizado',
        );
      }

      // Verificar se o SKU existe e pertence ao parceiro
      const produtoSku = await this.prisma.produtoSKU.findFirst({
        where: {
          id: createPedidoCompraItemDto.skuId,
          produto: {
            parceiroId: parceiroId,
          },
        },
        include: {
          produto: true,
        },
      });

      if (!produtoSku) {
        throw new NotFoundException(
          'SKU do produto não encontrado ou não pertence ao parceiro',
        );
      }

      // Verificar se o item já existe no pedido
      const itemExistente = await this.prisma.pedidoCompraItem.findFirst({
        where: {
          pedidoCompraId: createPedidoCompraItemDto.pedidoCompraId,
          skuId: createPedidoCompraItemDto.skuId,
        },
      });

      if (itemExistente) {
        throw new ConflictException(
          'Este SKU já foi adicionado ao pedido de compra',
        );
      }

      const pedidoCompraItem = await this.prisma.pedidoCompraItem.create({
        data: {
          pedidoCompraId: createPedidoCompraItemDto.pedidoCompraId,
          skuId: createPedidoCompraItemDto.skuId,
          qtd: createPedidoCompraItemDto.qtd,
          precoCompra: new Decimal(createPedidoCompraItemDto.precoCompra),
          observacao: createPedidoCompraItemDto.observacao,
        },
        include: {
          pedidoCompra: {
            select: {
              id: true,
              publicId: true,
            },
          },
          ProdutoSKU: {
            select: {
              id: true,
              cor: true,
              tamanho: true,
              produto: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });

      return this.mapToPedidoCompraItemEntity(pedidoCompraItem);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar item do pedido de compra');
    }
  }

  async findAll(parceiroId: number): Promise<PedidoCompraItem[]> {
    const itens = await this.prisma.pedidoCompraItem.findMany({
      where: {
        pedidoCompra: {
          parceiroId: parceiroId,
        },
      },
      include: {
        pedidoCompra: {
          select: {
            id: true,
            publicId: true,
          },
        },
        ProdutoSKU: {
          select: {
            id: true,
            cor: true,
            tamanho: true,
            produto: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return itens.map(item => this.mapToPedidoCompraItemEntity(item));
  }

  async findByPedidoCompra(
    pedidoCompraId: number,
    parceiroId: number,
  ): Promise<PedidoCompraItem[]> {
    // Verificar se o pedido de compra existe e pertence ao parceiro
    const pedidoCompra = await this.prisma.pedidoCompra.findFirst({
      where: {
        id: pedidoCompraId,
        parceiroId: parceiroId,
      },
    });

    if (!pedidoCompra) {
      throw new NotFoundException(
        'Pedido de compra não encontrado ou não pertence ao parceiro',
      );
    }

    const itens = await this.prisma.pedidoCompraItem.findMany({
      where: {
        pedidoCompraId: pedidoCompraId,
      },
      include: {
        pedidoCompra: {
          select: {
            id: true,
            publicId: true,
          },
        },
        ProdutoSKU: {
          select: {
            id: true,
            cor: true,
            tamanho: true,
            produto: {
              select: {
                id: true,
                nome: true,
                precoVenda: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return itens.map(item => this.mapToPedidoCompraItemEntity(item));
  }

  async findOne(id: number, parceiroId: number): Promise<PedidoCompraItem> {
    const item = await this.prisma.pedidoCompraItem.findFirst({
      where: {
        id: id,
        pedidoCompra: {
          parceiroId: parceiroId,
        },
      },
      include: {
        pedidoCompra: {
          select: {
            id: true,
            publicId: true,
          },
        },
        ProdutoSKU: {
          select: {
            id: true,
            cor: true,
            tamanho: true,
            produto: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Item do pedido de compra não encontrado ou não pertence ao parceiro',
      );
    }

    return this.mapToPedidoCompraItemEntity(item);
  }

  async update(
    id: number,
    updatePedidoCompraItemDto: UpdatePedidoCompraItemDto,
    parceiroId: number,
  ): Promise<PedidoCompraItem> {
    try {
      // Verificar se o item existe e pertence ao parceiro
      const itemExistente = await this.prisma.pedidoCompraItem.findFirst({
        where: {
          id: id,
          pedidoCompra: {
            parceiroId: parceiroId,
          },
        },
        include: {
          pedidoCompra: true,
        },
      });

      if (!itemExistente) {
        throw new NotFoundException(
          'Item do pedido de compra não encontrado ou não pertence ao parceiro',
        );
      }

      // Verificar se o pedido não está finalizado
      if (itemExistente.pedidoCompra.status === 3) {
        // FINALIZADO
        throw new ConflictException(
          'Não é possível editar itens de um pedido finalizado',
        );
      }

      // Se está mudando o SKU, verificar se o novo SKU existe e pertence ao parceiro
      if (
        updatePedidoCompraItemDto.skuId &&
        updatePedidoCompraItemDto.skuId !== itemExistente.skuId
      ) {
        const produtoSku = await this.prisma.produtoSKU.findFirst({
          where: {
            id: updatePedidoCompraItemDto.skuId,
            produto: {
              parceiroId: parceiroId,
            },
          },
        });

        if (!produtoSku) {
          throw new NotFoundException(
            'SKU do produto não encontrado ou não pertence ao parceiro',
          );
        }

        // Verificar se o novo SKU já existe no pedido
        const itemComNovoSku = await this.prisma.pedidoCompraItem.findFirst({
          where: {
            pedidoCompraId: itemExistente.pedidoCompraId,
            skuId: updatePedidoCompraItemDto.skuId,
            id: { not: id },
          },
        });

        if (itemComNovoSku) {
          throw new ConflictException(
            'Este SKU já foi adicionado ao pedido de compra',
          );
        }
      }

      const updateData: any = {};

      if (updatePedidoCompraItemDto.skuId !== undefined) {
        updateData.skuId = updatePedidoCompraItemDto.skuId;
      }
      if (updatePedidoCompraItemDto.qtd !== undefined) {
        updateData.qtd = updatePedidoCompraItemDto.qtd;
      }
      if (updatePedidoCompraItemDto.precoCompra !== undefined) {
        updateData.precoCompra = new Decimal(
          updatePedidoCompraItemDto.precoCompra,
        );
      }
      if (updatePedidoCompraItemDto.observacao !== undefined) {
        updateData.observacao = updatePedidoCompraItemDto.observacao;
      }

      const itemAtualizado = await this.prisma.pedidoCompraItem.update({
        where: { id },
        data: updateData,
        include: {
          pedidoCompra: {
            select: {
              id: true,
              publicId: true,
            },
          },
          ProdutoSKU: {
            select: {
              id: true,
              cor: true,
              tamanho: true,
              produto: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });

      return this.mapToPedidoCompraItemEntity(itemAtualizado);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar item do pedido de compra',
      );
    }
  }

  async remove(id: number, parceiroId: number): Promise<void> {
    try {
      // Verificar se o item existe e pertence ao parceiro
      const itemExistente = await this.prisma.pedidoCompraItem.findFirst({
        where: {
          id: id,
          pedidoCompra: {
            parceiroId: parceiroId,
          },
        },
        include: {
          pedidoCompra: true,
        },
      });

      if (!itemExistente) {
        throw new NotFoundException(
          'Item do pedido de compra não encontrado ou não pertence ao parceiro',
        );
      }

      // Verificar se o pedido não está finalizado
      if (itemExistente.pedidoCompra.status === 3) {
        // FINALIZADO
        throw new ConflictException(
          'Não é possível remover itens de um pedido finalizado',
        );
      }

      await this.prisma.pedidoCompraItem.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Erro ao remover item do pedido de compra');
    }
  }

  private mapToPedidoCompraItemEntity(item: any): PedidoCompraItem {
    return {
      id: item.id,
      pedidoCompraId: item.pedidoCompraId,
      skuId: item.skuId,
      qtd: item.qtd,
      precoCompra: item.precoCompra,
      observacao: item.observacao,
      pedidoCompra: item.pedidoCompra
        ? {
            id: item.pedidoCompra.id,
            publicId: item.pedidoCompra.publicId,
          }
        : undefined,
      ProdutoSKU: item.ProdutoSKU
        ? {
            id: item.ProdutoSKU.id,
            cor: item.ProdutoSKU.cor,
            tamanho: item.ProdutoSKU.tamanho,
            produto: {
              id: item.ProdutoSKU.produto.id,
              nome: item.ProdutoSKU.produto.nome,
              precoVenda: item.ProdutoSKU.produto.precoVenda,
            },
          }
        : undefined,
    };
  }
}
