import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMovimentoEstoqueDto,
  TipoMovimento,
} from './dto/create-movimento-estoque.dto';
import { MovimentoEstoqueResponseDto } from './dto/movimento-estoque-response.dto';
import { HistoricoSkuQueryDto } from './dto/historico-sku-query.dto';
import { AjusteConferenciaLoteDto } from './dto/ajuste-conferencia-lote.dto';

@Injectable()
export class MovimentoEstoqueService {
  constructor(private prisma: PrismaService) {}

  async create(
    createMovimentoEstoqueDto: CreateMovimentoEstoqueDto,
    usuarioId: number,
  ): Promise<MovimentoEstoqueResponseDto> {
    // Validar dados de entrada
    await this.validateMovimentoData(createMovimentoEstoqueDto);

    // Validar se SKU existe
    await this.validateSkuExists(createMovimentoEstoqueDto.skuId);

    // Validar se locais existem (quando fornecidos)
    if (createMovimentoEstoqueDto.localOrigemId) {
      await this.validateLocalExists(createMovimentoEstoqueDto.localOrigemId);
    }
    if (createMovimentoEstoqueDto.localDestinoId) {
      await this.validateLocalExists(createMovimentoEstoqueDto.localDestinoId);
    }

    // Validar estoque disponível para operações que retiram do estoque
    if (this.isOperacaoQueRetiraEstoque(createMovimentoEstoqueDto.tipo)) {
      await this.validateEstoqueDisponivel(
        createMovimentoEstoqueDto.skuId,
        createMovimentoEstoqueDto.localOrigemId!,
        createMovimentoEstoqueDto.qtd,
      );
    }

    // Para ajustes negativos, validar se há estoque suficiente
    if (
      createMovimentoEstoqueDto.tipo === TipoMovimento.AJUSTE &&
      createMovimentoEstoqueDto.qtd < 0
    ) {
      await this.validateEstoqueDisponivel(
        createMovimentoEstoqueDto.skuId,
        createMovimentoEstoqueDto.localDestinoId!,
        Math.abs(createMovimentoEstoqueDto.qtd),
      );
    }

    // Executar transação para criar movimento e atualizar estoque
    return await this.prisma.$transaction(async tx => {
      // Criar o movimento
      const movimento = await tx.movimentoEstoque.create({
        data: {
          skuId: createMovimentoEstoqueDto.skuId,
          tipo: createMovimentoEstoqueDto.tipo,
          qtd: createMovimentoEstoqueDto.qtd,
          idUsuario: usuarioId,
          localOrigemId: createMovimentoEstoqueDto.localOrigemId,
          localDestinoId: createMovimentoEstoqueDto.localDestinoId,
          observacao: createMovimentoEstoqueDto.observacao,
        },
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
          Usuario: {
            select: {
              id: true,
              publicId: true,
              nome: true,
            },
          },
          localOrigem: true,
          localDestino: true,
        },
      });

      // Atualizar estoque baseado no tipo de movimento
      await this.updateEstoque(
        tx,
        createMovimentoEstoqueDto.tipo,
        createMovimentoEstoqueDto.skuId,
        createMovimentoEstoqueDto.qtd,
        createMovimentoEstoqueDto.localOrigemId,
        createMovimentoEstoqueDto.localDestinoId,
      );

      return this.mapToResponseDto(movimento);
    });
  }

  async findAll(): Promise<MovimentoEstoqueResponseDto[]> {
    const movimentos = await this.prisma.movimentoEstoque.findMany({
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
        Usuario: {
          select: {
            id: true,
            publicId: true,
            nome: true,
          },
        },
        localOrigem: true,
        localDestino: true,
      },
      orderBy: {
        dataMovimento: 'desc',
      },
    });

    return movimentos.map(this.mapToResponseDto);
  }

  async findOne(id: number): Promise<MovimentoEstoqueResponseDto> {
    const movimento = await this.prisma.movimentoEstoque.findUnique({
      where: { id },
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
        Usuario: {
          select: {
            id: true,
            publicId: true,
            nome: true,
          },
        },
        localOrigem: true,
        localDestino: true,
      },
    });

    if (!movimento) {
      throw new NotFoundException(
        `Movimento de estoque com ID ${id} não encontrado`,
      );
    }

    return this.mapToResponseDto(movimento);
  }

  async findHistoricoSku(
    skuId: number,
    query: HistoricoSkuQueryDto,
  ): Promise<{
    data: MovimentoEstoqueResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Validar se SKU existe
    await this.validateSkuExists(skuId);

    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [movimentos, total] = await Promise.all([
      this.prisma.movimentoEstoque.findMany({
        where: { skuId },
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
          Usuario: {
            select: {
              id: true,
              publicId: true,
              nome: true,
            },
          },
          localOrigem: true,
          localDestino: true,
        },
        orderBy: {
          dataMovimento: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.movimentoEstoque.count({
        where: { skuId },
      }),
    ]);

    return {
      data: movimentos.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async processarAjustesConferenciaLote(
    ajusteConferenciaLoteDto: AjusteConferenciaLoteDto,
    usuarioId: number,
  ): Promise<{
    totalProcessados: number;
    totalIgnorados: number;
  }> {
    const { itens, observacao } = ajusteConferenciaLoteDto;

    // Validar se há itens para processar
    if (!itens || itens.length === 0) {
      throw new BadRequestException('Lista de itens não pode estar vazia');
    }

    // Filtrar apenas itens com diferença diferente de zero
    const itensParaAjuste = itens.filter(item => item.diferenca !== 0);

    if (itensParaAjuste.length === 0) {
      return {
        totalProcessados: 0,
        totalIgnorados: itens.length,
      };
    }

    // Validar todos os SKUs e locais antes de processar
    await this.validateAjustesConferenciaData(itensParaAjuste);

    // Executar transação para criar todos os movimentos
    return await this.prisma.$transaction(async tx => {
      for (const item of itensParaAjuste) {
        // Criar movimento de ajuste
        await tx.movimentoEstoque.create({
          data: {
            skuId: item.skuId,
            tipo: TipoMovimento.AJUSTE,
            qtd: item.diferenca,
            idUsuario: usuarioId,
            localDestinoId: item.localId,
            observacao:
              observacao ||
              `Ajuste de conferência - Diferença: ${item.diferenca}`,
          },
        });

        // Atualizar estoque baseado na diferença
        await this.updateEstoque(
          tx,
          TipoMovimento.AJUSTE,
          item.skuId,
          item.diferenca,
          null,
          item.localId,
        );
      }

      return {
        totalProcessados: itensParaAjuste.length,
        totalIgnorados: itens.length - itensParaAjuste.length,
      };
    });
  }

  // Validações privadas
  private async validateMovimentoData(
    dto: CreateMovimentoEstoqueDto,
  ): Promise<void> {
    const { tipo, localOrigemId, localDestinoId, qtd } = dto;

    // Validação específica para quantidade em ajustes
    if (tipo === TipoMovimento.AJUSTE && qtd === 0) {
      throw new BadRequestException('Quantidade para AJUSTE não pode ser zero');
    }

    switch (tipo) {
      case TipoMovimento.ENTRADA:
        if (!localDestinoId) {
          throw new BadRequestException(
            'Local de destino é obrigatório para movimentos de ENTRADA',
          );
        }
        break;

      case TipoMovimento.SAIDA:
      case TipoMovimento.CONDICIONAL:
        if (!localOrigemId) {
          throw new BadRequestException(
            `Local de origem é obrigatório para movimentos de ${tipo}`,
          );
        }
        break;

      case TipoMovimento.TRANSFERENCIA:
        if (!localOrigemId || !localDestinoId) {
          throw new BadRequestException(
            'Local de origem e destino são obrigatórios para TRANSFERENCIA',
          );
        }
        if (localOrigemId === localDestinoId) {
          throw new BadRequestException(
            'Local de origem e destino não podem ser iguais',
          );
        }
        break;

      case TipoMovimento.AJUSTE:
        if (!localDestinoId) {
          throw new BadRequestException(
            'Local de destino é obrigatório para movimentos de AJUSTE',
          );
        }
        break;

      case TipoMovimento.DEVOLUCAO:
        // TODO: Implementar validações específicas para devolução
        throw new BadRequestException(
          'Operação de DEVOLUÇÃO será implementada futuramente',
        );
    }
  }

  private async validateSkuExists(skuId: number): Promise<void> {
    const sku = await this.prisma.produtoSKU.findUnique({
      where: { id: skuId },
      select: { id: true },
    });

    if (!sku) {
      throw new NotFoundException(`SKU com ID ${skuId} não encontrado`);
    }
  }

  private async validateLocalExists(localId: number): Promise<void> {
    const local = await this.prisma.localEstoque.findUnique({
      where: { id: localId },
      select: { id: true },
    });

    if (!local) {
      throw new NotFoundException(`Local com ID ${localId} não encontrado`);
    }
  }

  private async validateAjustesConferenciaData(
    itens: Array<{ skuId: number; localId: number; diferenca: number }>,
  ): Promise<void> {
    // Validar SKUs únicos
    const skuIds = [...new Set(itens.map(item => item.skuId))];
    const skusExistentes = await this.prisma.produtoSKU.findMany({
      where: { id: { in: skuIds } },
      select: { id: true },
    });

    const skusExistentesIds = skusExistentes.map(sku => sku.id);
    const skusNaoEncontrados = skuIds.filter(
      id => !skusExistentesIds.includes(id),
    );

    if (skusNaoEncontrados.length > 0) {
      throw new NotFoundException(
        `SKUs não encontrados: ${skusNaoEncontrados.join(', ')}`,
      );
    }

    // Validar locais únicos
    const localIds = [...new Set(itens.map(item => item.localId))];
    const locaisExistentes = await this.prisma.localEstoque.findMany({
      where: { id: { in: localIds } },
      select: { id: true },
    });

    const locaisExistentesIds = locaisExistentes.map(local => local.id);
    const locaisNaoEncontrados = localIds.filter(
      id => !locaisExistentesIds.includes(id),
    );

    if (locaisNaoEncontrados.length > 0) {
      throw new NotFoundException(
        `Locais não encontrados: ${locaisNaoEncontrados.join(', ')}`,
      );
    }

    // Validar estoque disponível para ajustes negativos
    for (const item of itens) {
      if (item.diferenca < 0) {
        await this.validateEstoqueDisponivel(
          item.skuId,
          item.localId,
          Math.abs(item.diferenca),
        );
      }
    }
  }

  private isOperacaoQueRetiraEstoque(tipo: TipoMovimento): boolean {
    return [
      TipoMovimento.SAIDA,
      TipoMovimento.TRANSFERENCIA,
      TipoMovimento.CONDICIONAL,
    ].includes(tipo);
  }

  private async validateEstoqueDisponivel(
    skuId: number,
    localId: number,
    qtdSolicitada: number,
  ): Promise<void> {
    const estoque = await this.prisma.estoqueSKU.findUnique({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
      select: { qtd: true },
    });

    const qtdDisponivel = estoque?.qtd || 0;

    if (qtdDisponivel < qtdSolicitada) {
      throw new ConflictException(
        `Estoque insuficiente. Disponível: ${qtdDisponivel}, Solicitado: ${qtdSolicitada}`,
      );
    }
  }

  private async updateEstoque(
    tx: any,
    tipo: TipoMovimento,
    skuId: number,
    qtd: number,
    localOrigemId: number | null,
    localDestinoId: number | null,
  ): Promise<void> {
    switch (tipo) {
      case TipoMovimento.ENTRADA:
        await this.incrementarEstoque(tx, skuId, localDestinoId!, qtd);
        break;

      case TipoMovimento.SAIDA:
      case TipoMovimento.CONDICIONAL:
        await this.decrementarEstoque(tx, skuId, localOrigemId!, qtd);
        break;

      case TipoMovimento.TRANSFERENCIA:
        await this.decrementarEstoque(tx, skuId, localOrigemId!, qtd);
        await this.incrementarEstoque(tx, skuId, localDestinoId!, qtd);
        break;

      case TipoMovimento.AJUSTE:
        // Para ajustes, a quantidade pode ser positiva ou negativa
        if (qtd > 0) {
          // Ajuste positivo: incrementar estoque
          await this.incrementarEstoque(tx, skuId, localDestinoId!, qtd);
        } else {
          // Ajuste negativo: decrementar estoque
          await this.decrementarEstoque(
            tx,
            skuId,
            localDestinoId!,
            Math.abs(qtd),
          );
        }
        break;

      case TipoMovimento.DEVOLUCAO:
        // TODO: Implementar lógica de devolução
        break;
    }
  }

  private async incrementarEstoque(
    tx: any,
    skuId: number,
    localId: number,
    qtd: number,
  ): Promise<void> {
    await tx.estoqueSKU.upsert({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
      update: {
        qtd: {
          increment: qtd,
        },
      },
      create: {
        localId,
        skuId,
        qtd,
      },
    });
  }

  private async decrementarEstoque(
    tx: any,
    skuId: number,
    localId: number,
    qtd: number,
  ): Promise<void> {
    await tx.estoqueSKU.update({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
      data: {
        qtd: {
          decrement: qtd,
        },
      },
    });
  }

  private mapToResponseDto(movimento: any): MovimentoEstoqueResponseDto {
    return {
      id: movimento.id,
      tipo: movimento.tipo,
      qtd: movimento.qtd,
      dataMovimento: movimento.dataMovimento,
      observacao: movimento.observacao,
      sku: {
        id: movimento.sku.id,
        publicId: movimento.sku.publicId,
        cor: movimento.sku.cor,
        tamanho: movimento.sku.tamanho,
        produto: movimento.sku.produto,
      },
      Usuario: movimento.Usuario,
      localOrigem: movimento.localOrigem,
      localDestino: movimento.localDestino,
    };
  }
}
