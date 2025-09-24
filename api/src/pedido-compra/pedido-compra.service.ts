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
import { PedidoCompra } from './entities/pedido-compra.entity';
import { StatusPedidoCompra } from './enums/status-pedido-compra.enum';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class PedidoCompraService {
  constructor(private readonly prisma: PrismaService) {}

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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
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
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
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
    } catch (error) {
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
    } catch (error) {
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
