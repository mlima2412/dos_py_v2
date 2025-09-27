import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreatePedidoCompraDto } from './dto/create-pedido-compra.dto';
import { UpdatePedidoCompraDto } from './dto/update-pedido-compra.dto';
import { UpdateStatusPedidoCompraDto } from './dto/update-status-pedido-compra.dto';
import {
  ProcessaPedidoCompraDto,
  TipoPagamentoPedido,
} from './dto/processa-pedido-compra.dto';
import { PedidoCompra } from './entities/pedido-compra.entity';
import { StatusPedidoCompra } from './enums/status-pedido-compra.enum';
import { TipoMovimento } from '../movimento-estoque/dto/create-movimento-estoque.dto';
import {
  TipoPagamento,
  CreateDespesaDto,
} from '../despesas/dto/create-despesa.dto';
import { DespesasService } from '../despesas/despesas.service';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class PedidoCompraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly despesasService: DespesasService,
  ) {}

  async create(
    createPedidoCompraDto: CreatePedidoCompraDto,
    parceiroId: number,
  ): Promise<PedidoCompra> {
    try {
      // Verificar se o fornecedor existe e pertence ao parceiro
      const fornecedor = await this.prisma.fornecedor.findFirst({
        where: {
          id: createPedidoCompraDto.fornecedorId,
          parceiroId: parceiroId,
          ativo: true,
        },
      });

      if (!fornecedor) {
        throw new NotFoundException(
          'Fornecedor não encontrado ou não pertence ao parceiro',
        );
      }

      // Verificar se o local de estoque existe e pertence ao parceiro
      const localEstoque = await this.prisma.localEstoque.findFirst({
        where: {
          id: createPedidoCompraDto.localEntradaId,
          parceiroId: parceiroId,
        },
      });

      if (!localEstoque) {
        throw new NotFoundException(
          'Local de estoque não encontrado ou não pertence ao parceiro',
        );
      }

      // Verificar se a moeda existe (se fornecida)
      if (createPedidoCompraDto.currencyId) {
        const currency = await this.prisma.currency.findFirst({
          where: {
            id: createPedidoCompraDto.currencyId,
            ativo: true,
          },
        });

        if (!currency) {
          throw new NotFoundException('Moeda não encontrada ou inativa');
        }
      }

      const pedidoCompra = await this.prisma.pedidoCompra.create({
        data: {
          publicId: uuidv7(),
          parceiroId: parceiroId,
          localEntradaId: createPedidoCompraDto.localEntradaId,
          fornecedorId: createPedidoCompraDto.fornecedorId,
          dataEntrega: createPedidoCompraDto.dataEntrega
            ? new Date(createPedidoCompraDto.dataEntrega)
            : null,
          valorFrete: createPedidoCompraDto.valorFrete
            ? new Decimal(createPedidoCompraDto.valorFrete)
            : new Decimal(0),
          valorTotal: createPedidoCompraDto.valorTotal
            ? new Decimal(createPedidoCompraDto.valorTotal)
            : new Decimal(0),
          observacao: createPedidoCompraDto.observacao,
          valorComissao: createPedidoCompraDto.valorComissao
            ? new Decimal(createPedidoCompraDto.valorComissao)
            : new Decimal(0),
          cotacao: createPedidoCompraDto.cotacao || 1,
          currencyId: createPedidoCompraDto.currencyId,
          consignado: createPedidoCompraDto.consignado || false,
          status: StatusPedidoCompra.EDICAO,
        },
        include: {
          fornecedor: true,
          currency: true,
          Parceiro: true,
          LocalEntrada: true,
        },
      });

      return PedidoCompra.create(pedidoCompra);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException('Erro ao criar pedido de compra');
    }
  }

  async findAll(parceiroId: number): Promise<PedidoCompra[]> {
    const pedidosCompra = await this.prisma.pedidoCompra.findMany({
      where: {
        parceiroId: parceiroId,
      },
      include: {
        fornecedor: true,
        currency: true,
        Parceiro: true,
        LocalEntrada: true,
        PedidoCompraItem: {
          include: {
            ProdutoSKU: {
              include: {
                produto: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataPedido: 'desc',
      },
    });

    return pedidosCompra.map(pedido => PedidoCompra.create(pedido));
  }

  async findOne(publicId: string, parceiroId: number): Promise<PedidoCompra> {
    const pedidoCompra = await this.prisma.pedidoCompra.findFirst({
      where: {
        publicId: publicId,
        parceiroId: parceiroId,
      },
      include: {
        fornecedor: true,
        currency: true,
        Parceiro: true,
        LocalEntrada: true,
        PedidoCompraItem: {
          include: {
            ProdutoSKU: {
              include: {
                produto: true,
              },
            },
          },
        },
      },
    });

    if (!pedidoCompra) {
      throw new NotFoundException('Pedido de compra não encontrado');
    }

    return PedidoCompra.create(pedidoCompra);
  }

  async update(
    publicId: string,
    updatePedidoCompraDto: UpdatePedidoCompraDto,
    parceiroId: number,
  ): Promise<PedidoCompra> {
    // Verificar se o pedido existe e pertence ao parceiro
    const existingPedido = await this.prisma.pedidoCompra.findFirst({
      where: {
        publicId: publicId,
        parceiroId: parceiroId,
      },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido de compra não encontrado');
    }

    // Verificar se o pedido está em status que permite edição
    if (existingPedido.status === StatusPedidoCompra.FINALIZADO) {
      throw new ConflictException('Não é possível editar um pedido finalizado');
    }

    try {
      // Verificações de validação similares ao create
      if (updatePedidoCompraDto.fornecedorId) {
        const fornecedor = await this.prisma.fornecedor.findFirst({
          where: {
            id: updatePedidoCompraDto.fornecedorId,
            parceiroId: parceiroId,
            ativo: true,
          },
        });

        if (!fornecedor) {
          throw new NotFoundException(
            'Fornecedor não encontrado ou não pertence ao parceiro',
          );
        }
      }

      if (updatePedidoCompraDto.localEntradaId) {
        const localEstoque = await this.prisma.localEstoque.findFirst({
          where: {
            id: updatePedidoCompraDto.localEntradaId,
            parceiroId: parceiroId,
          },
        });

        if (!localEstoque) {
          throw new NotFoundException(
            'Local de estoque não encontrado ou não pertence ao parceiro',
          );
        }
      }

      if (updatePedidoCompraDto.currencyId) {
        const currency = await this.prisma.currency.findFirst({
          where: {
            id: updatePedidoCompraDto.currencyId,
            ativo: true,
          },
        });

        if (!currency) {
          throw new NotFoundException('Moeda não encontrada ou inativa');
        }
      }

      const updateData: any = {};

      if (updatePedidoCompraDto.localEntradaId !== undefined) {
        updateData.localEntradaId = updatePedidoCompraDto.localEntradaId;
      }
      if (updatePedidoCompraDto.fornecedorId !== undefined) {
        updateData.fornecedorId = updatePedidoCompraDto.fornecedorId;
      }
      if (updatePedidoCompraDto.dataEntrega !== undefined) {
        updateData.dataEntrega = updatePedidoCompraDto.dataEntrega
          ? new Date(updatePedidoCompraDto.dataEntrega)
          : null;
      }

      if (updatePedidoCompraDto.valorFrete !== undefined) {
        updateData.valorFrete = updatePedidoCompraDto.valorFrete
          ? new Decimal(updatePedidoCompraDto.valorFrete)
          : null;
      }
      if (updatePedidoCompraDto.valorTotal !== undefined) {
        updateData.valorTotal = updatePedidoCompraDto.valorTotal
          ? new Decimal(updatePedidoCompraDto.valorTotal)
          : null;
      }
      if (updatePedidoCompraDto.observacao !== undefined) {
        updateData.observacao = updatePedidoCompraDto.observacao;
      }
      if (updatePedidoCompraDto.valorComissao !== undefined) {
        updateData.valorComissao = updatePedidoCompraDto.valorComissao
          ? new Decimal(updatePedidoCompraDto.valorComissao)
          : null;
      }
      if (updatePedidoCompraDto.cotacao !== undefined) {
        updateData.cotacao = updatePedidoCompraDto.cotacao;
      }
      if (updatePedidoCompraDto.currencyId !== undefined) {
        updateData.currencyId = updatePedidoCompraDto.currencyId;
      }
      if (updatePedidoCompraDto.consignado !== undefined) {
        updateData.consignado = updatePedidoCompraDto.consignado;
      }

      const pedidoCompra = await this.prisma.pedidoCompra.update({
        where: {
          publicId: publicId,
        },
        data: updateData,
        include: {
          fornecedor: true,
          currency: true,
          Parceiro: true,
          LocalEntrada: true,
        },
      });

      return PedidoCompra.create(pedidoCompra);
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      throw new BadRequestException('Erro ao atualizar pedido de compra');
    }
  }

  async updateStatus(
    publicId: string,
    updateStatusDto: UpdateStatusPedidoCompraDto,
    parceiroId: number,
  ): Promise<PedidoCompra> {
    const existingPedido = await this.prisma.pedidoCompra.findFirst({
      where: {
        publicId: publicId,
        parceiroId: parceiroId,
      },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido de compra não encontrado');
    }

    // Validar transições de status
    const currentStatus = existingPedido.status;
    const newStatus = updateStatusDto.status;

    // Regras de transição de status
    if (currentStatus === StatusPedidoCompra.FINALIZADO) {
      throw new ConflictException(
        'Não é possível alterar o status de um pedido finalizado',
      );
    }

    if (
      currentStatus === StatusPedidoCompra.EDICAO &&
      newStatus === StatusPedidoCompra.FINALIZADO
    ) {
      throw new ConflictException(
        'Não é possível finalizar um pedido diretamente da edição. Deve passar por conclusão primeiro.',
      );
    }

    try {
      const pedidoCompra = await this.prisma.pedidoCompra.update({
        where: {
          publicId: publicId,
        },
        data: {
          status: newStatus,
        },
        include: {
          fornecedor: true,
          currency: true,
          Parceiro: true,
          LocalEntrada: true,
        },
      });

      return PedidoCompra.create(pedidoCompra);
    } catch {
      throw new BadRequestException('Erro ao atualizar status do pedido');
    }
  }

  async remove(publicId: string, parceiroId: number): Promise<void> {
    const existingPedido = await this.prisma.pedidoCompra.findFirst({
      where: {
        publicId: publicId,
        parceiroId: parceiroId,
      },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido de compra não encontrado');
    }

    // Verificar se o pedido pode ser removido
    if (existingPedido.status === StatusPedidoCompra.FINALIZADO) {
      throw new ConflictException(
        'Não é possível remover um pedido finalizado',
      );
    }

    try {
      await this.prisma.pedidoCompra.delete({
        where: {
          publicId: publicId,
        },
      });
    } catch {
      throw new BadRequestException('Erro ao remover pedido de compra');
    }
  }

  async findByStatus(
    status: StatusPedidoCompra,
    parceiroId: number,
  ): Promise<PedidoCompra[]> {
    const pedidosCompra = await this.prisma.pedidoCompra.findMany({
      where: {
        parceiroId: parceiroId,
        status: status,
      },
      include: {
        fornecedor: true,
        currency: true,
        Parceiro: true,
        LocalEntrada: true,
        PedidoCompraItem: {
          include: {
            ProdutoSKU: {
              include: {
                produto: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataPedido: 'desc',
      },
    });

    return pedidosCompra.map(pedido => PedidoCompra.create(pedido));
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    parceiroId: number;
    fornecedorId?: number;
    status?: string;
    localEntradaId?: number;
    consignado?: boolean;
  }) {
    const {
      page,
      limit,
      search,
      parceiroId,
      fornecedorId,
      status,
      localEntradaId,
      consignado,
    } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro obrigatório por parceiro
    andConditions.push({ parceiroId });

    // Filtro de busca (observação)
    if (search) {
      andConditions.push({
        observacao: { contains: search, mode: 'insensitive' },
      });
    }

    // Filtro por fornecedor
    if (fornecedorId) {
      andConditions.push({ fornecedorId });
    }

    // Filtro por status
    if (status) {
      andConditions.push({ status });
    }

    // Filtro por local de entrada
    if (localEntradaId) {
      andConditions.push({ localEntradaId });
    }

    // Filtro por consignado
    if (consignado !== undefined) {
      andConditions.push({ consignado });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados paginados
    const [pedidosCompra, total] = await Promise.all([
      this.prisma.pedidoCompra.findMany({
        where,
        include: {
          fornecedor: {
            select: {
              id: true,
              nome: true,
            },
          },
          currency: {
            select: {
              id: true,
              nome: true,
            },
          },
          Parceiro: {
            select: {
              id: true,
              nome: true,
            },
          },
          LocalEntrada: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: { dataPedido: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pedidoCompra.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: pedidosCompra.map(pedido => this.mapToPedidoCompraEntity(pedido)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async processaPedidoCompra(
    processaPedidoCompraDto: ProcessaPedidoCompraDto,
    parceiroId: number,
    usuarioId: number,
  ): Promise<PedidoCompra> {
    return await this.prisma.$transaction(async tx => {
      // 1. Localizar o pedido de compra e validar
      const pedidoCompra = await tx.pedidoCompra.findFirst({
        where: {
          publicId: processaPedidoCompraDto.publicId,
          parceiroId: parceiroId,
        },
        include: {
          fornecedor: true,
          currency: true,
          Parceiro: {
            include: {
              currency: true,
            },
          },
          LocalEntrada: true,
          PedidoCompraItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: true,
                },
              },
            },
          },
        },
      });

      if (!pedidoCompra) {
        throw new NotFoundException('Pedido de compra não encontrado');
      }
      if (pedidoCompra.status === StatusPedidoCompra.FINALIZADO) {
        throw new ConflictException('Pedido de compra já foi processado');
      }

      // 2. Validar dados de pagamento
      this.validatePaymentData(processaPedidoCompraDto);

      // 3. Buscar subcategoria "Entrada de Estoque"
      const subCategoriaEntradaEstoque = await tx.subCategoriaDespesa.findFirst(
        {
          where: {
            descricao: 'Entrada de Estoque',
            ativo: true,
          },
        },
      );

      if (!subCategoriaEntradaEstoque) {
        throw new NotFoundException(
          'Subcategoria "Entrada de Estoque" não encontrada',
        );
      }

      // 4. Processar movimentação de estoque para cada item
      const produtosProcessados = new Set<number>();

      for (const item of pedidoCompra.PedidoCompraItem) {
        // Criar movimento de entrada de estoque
        await tx.movimentoEstoque.create({
          data: {
            skuId: item.skuId,
            tipo: TipoMovimento.ENTRADA,
            qtd: item.qtd,
            idUsuario: usuarioId,
            localDestinoId: pedidoCompra.localEntradaId,
            observacao: `Entrada do pedido ${pedidoCompra.id}`,
          },
        });

        // Atualizar estoque
        await tx.estoqueSKU.upsert({
          where: {
            localId_skuId: {
              localId: pedidoCompra.localEntradaId,
              skuId: item.skuId,
            },
          },
          update: {
            qtd: {
              increment: item.qtd,
            },
          },
          create: {
            localId: pedidoCompra.localEntradaId,
            skuId: item.skuId,
            qtd: item.qtd,
          },
        });

        // 5. Verificar e atualizar preço do produto se necessário (apenas uma vez por produto)
        const produto = item.ProdutoSKU.produto;

        if (!produtosProcessados.has(produto.id)) {
          produtosProcessados.add(produto.id);

          const precoAtual = Number(produto.precoCompra);
          const precoPedido = Number(item.precoCompra);

          if (precoAtual !== precoPedido) {
            // Atualizar preço do produto
            await tx.produto.update({
              where: { id: produto.id },
              data: {
                precoCompra: new Decimal(precoPedido),
              },
            });

            // Registrar no histórico de preços
            await tx.produtoHistoricoPreco.create({
              data: {
                produtoId: produto.id,
                preco: new Decimal(precoPedido),
                data: new Date(),
              },
            });
          }
        }
      }

      // 6. Gerar despesas usando o DespesasService
      // Atualiza o valorTotal com a cotação do pedido
      if (pedidoCompra.currency.id !== pedidoCompra.Parceiro.currency.id) {
        pedidoCompra.valorTotal = new Decimal(pedidoCompra.valorTotal).mul(
          pedidoCompra.cotacao,
        );
      }

      if (
        processaPedidoCompraDto.paymentType === TipoPagamentoPedido.PARCELADO &&
        processaPedidoCompraDto.entryValue &&
        processaPedidoCompraDto.entryValue > 0
      ) {
        // Criar despesa à vista para o valor de entrada
        const despesaEntradaData = this.createDespesaData(
          processaPedidoCompraDto,
          pedidoCompra,
          subCategoriaEntradaEstoque.idSubCategoria,
          true, // isEntryValue
        );

        await this.despesasService.createWithinTransaction(
          despesaEntradaData,
          pedidoCompra.parceiroId,
          tx,
        );

        //Criar despesa parcelada para o valor restante
        const despesaParceladaData = this.createDespesaData(
          processaPedidoCompraDto,
          pedidoCompra,
          subCategoriaEntradaEstoque.idSubCategoria,
          false, // isEntryValue
        );

        await this.despesasService.createWithinTransaction(
          despesaParceladaData,
          pedidoCompra.parceiroId,
          tx,
        );
      } else {
        // Criar despesa única
        const despesaData = this.createDespesaData(
          processaPedidoCompraDto,
          pedidoCompra,
          subCategoriaEntradaEstoque.idSubCategoria,
        );

        await this.despesasService.createWithinTransaction(
          despesaData,
          pedidoCompra.parceiroId,
          tx,
        );
      }

      // 9. Atualizar status do pedido para FINALIZADO
      const pedidoAtualizado = await tx.pedidoCompra.update({
        where: { id: pedidoCompra.id },
        data: {
          status: StatusPedidoCompra.FINALIZADO,
        },
        include: {
          fornecedor: true,
          currency: true,
          Parceiro: true,
          LocalEntrada: true,
        },
      });

      return PedidoCompra.create(pedidoAtualizado);
    });
  }

  private validatePaymentData(dto: ProcessaPedidoCompraDto): void {
    switch (dto.paymentType) {
      case TipoPagamentoPedido.A_PRAZO_SEM_PARCELAS:
        if (!dto.dueDate) {
          throw new BadRequestException(
            'Data de vencimento é obrigatória para pagamento à prazo',
          );
        }
        break;
      case TipoPagamentoPedido.PARCELADO:
        if (!dto.firstInstallmentDate) {
          throw new BadRequestException(
            'Data da primeira parcela é obrigatória para pagamento parcelado',
          );
        }
        if (dto.installments < 2) {
          throw new BadRequestException(
            'Pagamento parcelado deve ter pelo menos 2 parcelas',
          );
        }
        break;
    }
  }

  private createDespesaData(
    dto: ProcessaPedidoCompraDto,
    pedidoCompra: any,
    subCategoriaId: number,
    isEntryValue?: boolean,
  ): CreateDespesaDto {
    const now = new Date();

    // Obter moeda do parceiro
    const moedaParceiro = pedidoCompra.Parceiro?.currency;
    // Iguala a moeda para evitar outra conversão.
    // Os pedidos de compra já entram aqui convertidos para a moeda do parceiro.

    // Determinar moeda e valor da despesa
    let valorDespesa: number;

    // Se é valor de entrada, usar apenas o valor de entrada
    if (isEntryValue) {
      valorDespesa = dto.entryValue || 0;
    } else {
      // Se é parcelado com entrada, subtrair o valor de entrada do total
      if (
        dto.paymentType === TipoPagamentoPedido.PARCELADO &&
        dto.entryValue &&
        dto.entryValue > 0
      ) {
        valorDespesa = Number(pedidoCompra.valorTotal) - dto.entryValue;
      } else {
        valorDespesa = Number(pedidoCompra.valorTotal);
      }
    }

    const despesaData: CreateDespesaDto = {
      dataRegistro: now.toISOString(),
      valorTotal: valorDespesa,
      descricao: isEntryValue
        ? `Entrada Pedido ${pedidoCompra.id}`
        : `Compra Pedido ${pedidoCompra.id}`,
      tipoPagamento: isEntryValue
        ? TipoPagamento.A_VISTA_IMEDIATA
        : this.mapPaymentType(dto.paymentType),
      subCategoriaId: subCategoriaId,
      parceiroId: pedidoCompra.parceiroId,
      fornecedorId: pedidoCompra.fornecedorId,
      currencyId: moedaParceiro.id,
      cotacao: undefined,
    };

    // Adicionar campos específicos baseados no tipo de pagamento
    if (!isEntryValue) {
      switch (dto.paymentType) {
        case TipoPagamentoPedido.A_PRAZO_SEM_PARCELAS:
          if (dto.dueDate) {
            despesaData.dataVencimento = dto.dueDate;
          }
          break;
        case TipoPagamentoPedido.PARCELADO:
          despesaData.numeroParcelas = dto.installments;
          // Para parcelas, não incluir valor de entrada (já foi tratado na despesa à vista)
          if (dto.firstInstallmentDate) {
            despesaData.dataPrimeiraParcela = dto.firstInstallmentDate;
          }
          break;
      }
    }

    return despesaData;
  }

  private mapPaymentType(paymentType: TipoPagamentoPedido): TipoPagamento {
    switch (paymentType) {
      case TipoPagamentoPedido.A_VISTA_IMEDIATA:
        return TipoPagamento.A_VISTA_IMEDIATA;
      case TipoPagamentoPedido.A_PRAZO_SEM_PARCELAS:
        return TipoPagamento.A_PRAZO_SEM_PARCELAS;
      case TipoPagamentoPedido.PARCELADO:
        return TipoPagamento.PARCELADO;
      default:
        throw new BadRequestException('Tipo de pagamento inválido');
    }
  }

  private mapToPedidoCompraEntity(pedido: any): PedidoCompra {
    return {
      id: pedido.id,
      publicId: pedido.publicId,
      parceiroId: pedido.parceiroId,
      localEntradaId: pedido.localEntradaId,
      fornecedorId: pedido.fornecedorId,
      dataPedido: pedido.dataPedido,
      dataEntrega: pedido.dataEntrega,
      valorFrete: pedido.valorFrete,
      valorTotal: pedido.valorTotal,
      observacao: pedido.observacao,
      valorComissao: pedido.valorComissao,
      cotacao: pedido.cotacao,
      currencyId: pedido.currencyId,
      consignado: pedido.consignado,
      status: pedido.status,
      fornecedor: pedido.fornecedor
        ? {
            id: pedido.fornecedor.id,
            nome: pedido.fornecedor.nome,
          }
        : undefined,
      currency: pedido.currency
        ? {
            id: pedido.currency.id,
            nome: pedido.currency.nome,
          }
        : undefined,
      Parceiro: pedido.Parceiro
        ? {
            id: pedido.Parceiro.id,
            nome: pedido.Parceiro.nome,
          }
        : undefined,
      LocalEntrada: pedido.LocalEntrada
        ? {
            id: pedido.LocalEntrada.id,
            nome: pedido.LocalEntrada.nome,
          }
        : undefined,
    };
  }
}
