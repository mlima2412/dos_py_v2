import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferenciaEstoqueDto } from './dto/create-transferencia-estoque.dto';

import { ConfirmarRecebimentoDto } from './dto/confirmar-recebimento.dto';
import { TransferenciaEstoqueResponseDto } from './dto/transferencia-estoque-response.dto';
import { MovimentoEstoqueService } from '../movimento-estoque/movimento-estoque.service';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class TransferenciaEstoqueService {
  constructor(
    private prisma: PrismaService,
    private movimentoEstoqueService: MovimentoEstoqueService,
  ) {}

  async create(
    createTransferenciaEstoqueDto: CreateTransferenciaEstoqueDto,
    enviadoPorUsuarioId: number,
  ): Promise<{ publicId: string }> {
    const { localOrigemId, localDestinoId, skus } =
      createTransferenciaEstoqueDto;

    // Validar se os locais existem
    const localOrigem = await this.prisma.localEstoque.findUnique({
      where: { id: localOrigemId },
    });
    if (!localOrigem) {
      throw new NotFoundException('Local de origem não encontrado');
    }

    const localDestino = await this.prisma.localEstoque.findUnique({
      where: { id: localDestinoId },
    });
    if (!localDestino) {
      throw new NotFoundException('Local de destino não encontrado');
    }

    if (localOrigemId === localDestinoId) {
      throw new BadRequestException(
        'Local de origem e destino não podem ser iguais',
      );
    }

    // Validar disponibilidade de estoque para todos os SKUs
    for (const sku of skus) {
      const estoqueAtual = await this.prisma.estoqueSKU.findFirst({
        where: {
          skuId: sku.skuId,
          localId: localOrigemId,
        },
      });

      if (!estoqueAtual || estoqueAtual.qtd < sku.qtd) {
        const produtoSku = await this.prisma.produtoSKU.findUnique({
          where: { id: sku.skuId },
          include: { produto: true },
        });

        throw new BadRequestException(
          `Estoque insuficiente para o SKU ${produtoSku?.produto?.nome || sku.skuId}. ` +
            `Disponível: ${estoqueAtual?.qtd || 0}, Solicitado: ${sku.qtd}`,
        );
      }
    }

    // Calcular valor total da transferência
    const valorTotal = await this.calculateValorTotal(skus);

    return this.prisma.$transaction(async tx => {
      // Criar a transferência
      const transferencia = await tx.transferenciaEstoque.create({
        data: {
          publicId: uuidv7(),
          localOrigemId,
          localDestinoId,
          enviadoPorUsuarioId,
          qtd: skus.reduce((total, sku) => total + sku.qtd, 0), // Soma total de quantidades
          valorTotal,
        },
      });

      // Criar movimentos de estoque e itens da transferência
      for (const skuData of skus) {
        // Criar movimento de estoque (saída do local origem)
        const movimento = await tx.movimentoEstoque.create({
          data: {
            skuId: skuData.skuId,
            localOrigemId,
            localDestinoId,
            tipo: 'TRANSFERENCIA',
            qtd: skuData.qtd,
            idUsuario: enviadoPorUsuarioId,
            observacao:
              skuData.observacao || `Transferência ${transferencia.publicId}`,
          },
        });

        // Atualizar estoque do local origem (diminuir)
        await tx.estoqueSKU.updateMany({
          where: {
            skuId: skuData.skuId,
            localId: localOrigemId,
          },
          data: {
            qtd: {
              decrement: skuData.qtd,
            },
          },
        });

        // Criar ou atualizar estoque do local destino (aumentar)
        const estoqueDestino = await tx.estoqueSKU.findFirst({
          where: {
            skuId: skuData.skuId,
            localId: localDestinoId,
          },
        });

        if (estoqueDestino) {
          await tx.estoqueSKU.updateMany({
            where: {
              skuId: skuData.skuId,
              localId: localDestinoId,
            },
            data: {
              qtd: {
                increment: skuData.qtd,
              },
            },
          });
        } else {
          await tx.estoqueSKU.create({
            data: {
              skuId: skuData.skuId,
              localId: localDestinoId,
              qtd: skuData.qtd,
            },
          });
        }

        // Criar item da transferência
        await tx.transferenciaEstoqueItem.create({
          data: {
            transferenciaId: transferencia.id,
            movimentoEstoqueId: movimento.id,
          },
        });
      }

      return { publicId: transferencia.publicId };
    });
  }

  async findAll(): Promise<TransferenciaEstoqueResponseDto[]> {
    const transferencias = await this.prisma.transferenciaEstoque.findMany({
      include: {
        localOrigem: true,
        localDestino: true,
        enviadoPorUsuario: true,
        recebidoPorUsuario: true,
        TransferenciaEstoqueItem: {
          include: {
            MovimentoEstoque: {
              include: {
                sku: {
                  include: {
                    produto: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dataTransferencia: 'desc',
      },
    });

    return transferencias.map(transferencia =>
      this.mapToResponseDto(transferencia),
    );
  }

  async findOne(id: number): Promise<TransferenciaEstoqueResponseDto> {
    const transferencia = await this.prisma.transferenciaEstoque.findUnique({
      where: { id },
      include: {
        localOrigem: true,
        localDestino: true,
        enviadoPorUsuario: true,
        recebidoPorUsuario: true,
        TransferenciaEstoqueItem: {
          include: {
            MovimentoEstoque: {
              include: {
                sku: {
                  include: {
                    produto: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!transferencia) {
      throw new NotFoundException(`Transferência com ID ${id} não encontrada`);
    }

    return this.mapToResponseDto(transferencia);
  }

  async confirmarRecebimento(
    id: number,
    confirmarRecebimentoDto: ConfirmarRecebimentoDto,
    usuarioId: number,
  ): Promise<TransferenciaEstoqueResponseDto> {
    const transferencia = await this.prisma.transferenciaEstoque.findUnique({
      where: { id },
    });

    if (!transferencia) {
      throw new NotFoundException(`Transferência com ID ${id} não encontrada`);
    }

    if (transferencia.dataRecebimento) {
      throw new ConflictException('Esta transferência já foi confirmada');
    }

    const transferenciaAtualizada =
      await this.prisma.transferenciaEstoque.update({
        where: { id },
        data: {
          dataRecebimento: new Date(),
          recebidoPorUsuarioId: usuarioId,
        },
        include: {
          localOrigem: true,
          localDestino: true,
          enviadoPorUsuario: true,
          recebidoPorUsuario: true,
          TransferenciaEstoqueItem: {
            include: {
              MovimentoEstoque: {
                include: {
                  sku: {
                    include: {
                      produto: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    return this.mapToResponseDto(transferenciaAtualizada);
  }

  async remove(id: number): Promise<void> {
    const transferencia = await this.prisma.transferenciaEstoque.findUnique({
      where: { id },
      include: {
        TransferenciaEstoqueItem: {
          include: {
            MovimentoEstoque: true,
          },
        },
      },
    });

    if (!transferencia) {
      throw new NotFoundException(`Transferência com ID ${id} não encontrada`);
    }

    if (transferencia.dataRecebimento) {
      throw new ConflictException(
        'Não é possível excluir uma transferência já confirmada',
      );
    }

    await this.prisma.$transaction(async tx => {
      // Reverter movimentações de estoque
      for (const item of transferencia.TransferenciaEstoqueItem) {
        const movimento = item.MovimentoEstoque;

        // Reverter estoque do local origem (aumentar)
        await tx.estoqueSKU.updateMany({
          where: {
            skuId: movimento.skuId,
            localId: movimento.localOrigemId!,
          },
          data: {
            qtd: {
              increment: movimento.qtd,
            },
          },
        });

        // Reverter estoque do local destino (diminuir)
        await tx.estoqueSKU.updateMany({
          where: {
            skuId: movimento.skuId,
            localId: movimento.localDestinoId!,
          },
          data: {
            qtd: {
              decrement: movimento.qtd,
            },
          },
        });
      }

      // Excluir itens da transferência
      await tx.transferenciaEstoqueItem.deleteMany({
        where: { transferenciaId: id },
      });

      // Excluir movimentos de estoque
      const movimentoIds = transferencia.TransferenciaEstoqueItem.map(
        item => item.movimentoEstoqueId,
      );
      await tx.movimentoEstoque.deleteMany({
        where: { id: { in: movimentoIds } },
      });

      // Excluir a transferência
      await tx.transferenciaEstoque.delete({
        where: { id },
      });
    });
  }

  private async validateTransferenciaData(
    dto: CreateTransferenciaEstoqueDto,
  ): Promise<void> {
    const { localOrigemId, localDestinoId, skus } = dto;

    if (localOrigemId === localDestinoId) {
      throw new BadRequestException(
        'Local de origem e destino não podem ser iguais',
      );
    }

    if (!skus || skus.length === 0) {
      throw new BadRequestException('É necessário informar pelo menos um SKU');
    }

    // Validar se todos os SKUs existem
    for (const sku of skus) {
      await this.validateEstoqueDisponivel(sku.skuId, localOrigemId, sku.qtd);
    }
  }

  private async validateLocalExists(localId: number): Promise<void> {
    const local = await this.prisma.localEstoque.findUnique({
      where: { id: localId },
    });

    if (!local) {
      throw new NotFoundException(`Local com ID ${localId} não encontrado`);
    }
  }

  private async validateEstoqueDisponivel(
    skuId: number,
    localId: number,
    qtdSolicitada: number,
  ): Promise<void> {
    const estoque = await this.prisma.estoqueSKU.findFirst({
      where: {
        skuId,
        localId,
      },
    });

    if (!estoque || estoque.qtd < qtdSolicitada) {
      const produtoSku = await this.prisma.produtoSKU.findUnique({
        where: { id: skuId },
        include: { produto: true },
      });

      throw new BadRequestException(
        `Estoque insuficiente para o SKU ${produtoSku?.produto?.nome || skuId}. ` +
          `Disponível: ${estoque?.qtd || 0}, Solicitado: ${qtdSolicitada}`,
      );
    }
  }

  private async calculateValorTotal(skus: any[]): Promise<number> {
    let valorTotal = 0;

    for (const sku of skus) {
      const produtoSku = await this.prisma.produtoSKU.findUnique({
        where: { id: sku.skuId },
        include: { produto: true },
      });

      if (produtoSku?.produto?.precoVenda) {
        valorTotal += Number(produtoSku.produto.precoVenda) * sku.qtd;
      }
    }

    return valorTotal;
  }

  private async updateEstoqueTransferencia(
    tx: any,
    skuId: number,
    qtd: number,
    localOrigemId: number,
    localDestinoId: number,
  ): Promise<void> {
    // Diminuir estoque do local origem
    await tx.estoqueSKU.updateMany({
      where: {
        skuId,
        localId: localOrigemId,
      },
      data: {
        qtd: {
          decrement: qtd,
        },
      },
    });

    // Verificar se existe estoque no local destino
    const estoqueDestino = await tx.estoqueSKU.findFirst({
      where: {
        skuId,
        localId: localDestinoId,
      },
    });

    if (estoqueDestino) {
      // Aumentar estoque do local destino
      await tx.estoqueSKU.updateMany({
        where: {
          skuId,
          localId: localDestinoId,
        },
        data: {
          qtd: {
            increment: qtd,
          },
        },
      });
    } else {
      // Criar novo registro de estoque no local destino
      await tx.estoqueSKU.create({
        data: {
          skuId,
          localId: localDestinoId,
          qtd,
        },
      });
    }
  }

  private mapToResponseDto(
    transferencia: any,
  ): TransferenciaEstoqueResponseDto {
    return {
      id: transferencia.id,
      publicId: transferencia.publicId,
      qtd: transferencia.qtd,
      valorTotal: Number(transferencia.valorTotal),
      dataTransferencia: transferencia.dataTransferencia,
      dataRecebimento: transferencia.dataRecebimento,
      localOrigem: {
        id: transferencia.localOrigem.id,
        publicId: transferencia.localOrigem.publicId,
        nome: transferencia.localOrigem.nome,
        descricao: transferencia.localOrigem.descricao,
        endereco: transferencia.localOrigem.endereco,
      },
      localDestino: {
        id: transferencia.localDestino.id,
        publicId: transferencia.localDestino.publicId,
        nome: transferencia.localDestino.nome,
        descricao: transferencia.localDestino.descricao,
        endereco: transferencia.localDestino.endereco,
      },
      enviadoPorUsuario: {
        id: transferencia.enviadoPorUsuario.id,
        publicId: transferencia.enviadoPorUsuario.publicId,
        nome: transferencia.enviadoPorUsuario.nome,
      },
      recebidoPorUsuario: transferencia.recebidoPorUsuario
        ? {
            id: transferencia.recebidoPorUsuario.id,
            publicId: transferencia.recebidoPorUsuario.publicId,
            nome: transferencia.recebidoPorUsuario.nome,
          }
        : null,
      TransferenciaEstoqueItem:
        transferencia.TransferenciaEstoqueItem?.map((item: any) => ({
          id: item.id,
          transferenciaId: item.transferenciaId,
          movimentoEstoqueId: item.movimentoEstoqueId,
        })) || [],
    };
  }
}
