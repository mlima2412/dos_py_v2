import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferenciaEstoqueSkuDto } from './dto/create-transferencia-estoque-sku.dto';
import { UpdateTransferenciaEstoqueSkuDto } from './dto/update-transferencia-estoque-sku.dto';
import { TransferenciaEstoqueSkuResponseDto } from './dto/transferencia-estoque-sku-response.dto';
import { TransferenciaSkuSimplesDto } from './dto/transferencia-sku-simples.dto';

@Injectable()
export class TransferenciaEstoqueSkuService {
  constructor(private prisma: PrismaService) {}

  async create(
    createTransferenciaEstoqueSkuDto: CreateTransferenciaEstoqueSkuDto,
  ): Promise<TransferenciaEstoqueSkuResponseDto> {
    // Validar se transferência existe
    await this.validateTransferenciaExists(
      createTransferenciaEstoqueSkuDto.transferenciaId,
    );

    // Validar se movimento existe
    await this.validateMovimentoExists(
      createTransferenciaEstoqueSkuDto.movimentoEstoqueId,
    );

    const item = await this.prisma.transferenciaEstoqueItem.create({
      data: {
        transferenciaId: createTransferenciaEstoqueSkuDto.transferenciaId,
        movimentoEstoqueId: createTransferenciaEstoqueSkuDto.movimentoEstoqueId,
      },
      include: {
        TransferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            qtd: true,
            dataTransferencia: true,
          },
        },
        MovimentoEstoque: {
          include: {
            sku: {
              include: {
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(item);
  }

  async findAll(
    transferenciaPublicId?: string,
  ): Promise<TransferenciaEstoqueSkuResponseDto[]> {
    const whereClause: any = {};

    if (transferenciaPublicId) {
      whereClause.TransferenciaEstoque = {
        publicId: transferenciaPublicId,
      };
    }

    const itens = await this.prisma.transferenciaEstoqueItem.findMany({
      where: whereClause,
      include: {
        TransferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            qtd: true,
            dataTransferencia: true,
          },
        },
        MovimentoEstoque: {
          include: {
            sku: {
              include: {
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return itens.map(this.mapToResponseDto);
  }

  async findOne(id: number): Promise<TransferenciaEstoqueSkuResponseDto> {
    const item = await this.prisma.transferenciaEstoqueItem.findUnique({
      where: { id },
      include: {
        TransferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            qtd: true,
            dataTransferencia: true,
          },
        },
        MovimentoEstoque: {
          include: {
            sku: {
              include: {
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Item de transferência com ID ${id} não encontrado`,
      );
    }

    return this.mapToResponseDto(item);
  }

  async findByTransferenciaPublicId(
    transferenciaPublicId: string,
  ): Promise<TransferenciaSkuSimplesDto[]> {
    const itens = await this.prisma.transferenciaEstoqueItem.findMany({
      where: { 
        TransferenciaEstoque: {
          publicId: transferenciaPublicId,
        }
      },
      include: {
        MovimentoEstoque: {
          include: {
            sku: {
              include: {
                produto: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (itens.length === 0) {
      throw new NotFoundException(
        `Nenhum item encontrado para a transferência ${transferenciaPublicId}`,
      );
    }

    return itens.map(item => ({
      id: item.id,
      produto: item.MovimentoEstoque.sku.produto.nome,
      cor: item.MovimentoEstoque.sku.cor || 'N/A',
      tamanho: item.MovimentoEstoque.sku.tamanho || 'N/A',
      quantidade: item.MovimentoEstoque.qtd,
    }));
  }

  async update(
    id: number,
    updateTransferenciaEstoqueSkuDto: UpdateTransferenciaEstoqueSkuDto,
  ): Promise<TransferenciaEstoqueSkuResponseDto> {
    // Verificar se item existe
    await this.findOne(id);

    // Se estiver atualizando transferência, validar se existe
    if (updateTransferenciaEstoqueSkuDto.transferenciaId) {
      await this.validateTransferenciaExists(
        updateTransferenciaEstoqueSkuDto.transferenciaId,
      );
    }

    // Se estiver atualizando movimento, validar se existe
    if (updateTransferenciaEstoqueSkuDto.movimentoEstoqueId) {
      await this.validateMovimentoExists(
        updateTransferenciaEstoqueSkuDto.movimentoEstoqueId,
      );
    }

    const item = await this.prisma.transferenciaEstoqueItem.update({
      where: { id },
      data: updateTransferenciaEstoqueSkuDto,
      include: {
        TransferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            qtd: true,
            dataTransferencia: true,
          },
        },
        MovimentoEstoque: {
          include: {
            sku: {
              include: {
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(item);
  }

  async remove(id: number): Promise<void> {
    // Verificar se item existe
    await this.findOne(id);

    await this.prisma.transferenciaEstoqueItem.delete({
      where: { id },
    });
  }

  // Métodos privados de validação
  private async validateTransferenciaExists(
    transferenciaId: number,
  ): Promise<void> {
    const transferencia = await this.prisma.transferenciaEstoque.findUnique({
      where: { id: transferenciaId },
    });

    if (!transferencia) {
      throw new NotFoundException(
        `Transferência com ID ${transferenciaId} não encontrada`,
      );
    }
  }

  private async validateMovimentoExists(movimentoId: number): Promise<void> {
    const movimento = await this.prisma.movimentoEstoque.findUnique({
      where: { id: movimentoId },
    });

    if (!movimento) {
      throw new NotFoundException(
        `Movimento de estoque com ID ${movimentoId} não encontrado`,
      );
    }
  }

  private mapToResponseDto(item: any): TransferenciaEstoqueSkuResponseDto {
    return {
      id: item.id,
      transferenciaId: item.transferenciaId,
      movimentoEstoqueId: item.movimentoEstoqueId,
      TransferenciaEstoque: item.TransferenciaEstoque,
      MovimentoEstoque: {
        id: item.MovimentoEstoque.id,
        tipo: item.MovimentoEstoque.tipo,
        qtd: item.MovimentoEstoque.qtd,
        dataMovimento: item.MovimentoEstoque.dataMovimento,
        observacao: item.MovimentoEstoque.observacao,
        sku: {
          id: item.MovimentoEstoque.sku.id,
          publicId: item.MovimentoEstoque.sku.publicId,
          cor: item.MovimentoEstoque.sku.cor,
          codCor: item.MovimentoEstoque.sku.codCor,
          tamanho: item.MovimentoEstoque.sku.tamanho,
          produto: item.MovimentoEstoque.sku.produto,
        },
      },
    };
  }
}
