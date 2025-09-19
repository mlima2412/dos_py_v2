import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConferenciaItemDto } from './dto/create-conferencia-item.dto';
import { UpdateConferenciaItemDto } from './dto/update-conferencia-item.dto';
import { ConferenciaItem } from './entities/conferencia-item.entity';

@Injectable()
export class ConferenciaItemService {
  constructor(private prisma: PrismaService) {}

  async create(
    createConferenciaItemDto: CreateConferenciaItemDto,
  ): Promise<ConferenciaItem> {
    // Verificar se a conferência existe
    await this.validateConferencia(createConferenciaItemDto.conferenciaId);

    // Verificar se o SKU existe
    await this.validateSKU(createConferenciaItemDto.skuId);

    // Verificar se já existe item para este SKU nesta conferência
    await this.validateUniqueItem(
      createConferenciaItemDto.conferenciaId,
      createConferenciaItemDto.skuId,
    );

    // Buscar quantidade atual no estoque se não fornecida
    let qtdSistema = createConferenciaItemDto.qtdSistema;
    if (qtdSistema === undefined) {
      qtdSistema = await this.getQuantidadeEstoque(
        createConferenciaItemDto.skuId,
      );
    }

    // Criar entidade e validar regras de negócio
    const itemEntity = ConferenciaItem.create({
      ...createConferenciaItemDto,
      qtdSistema,
    });

    const item = await this.prisma.conferenciaItem.create({
      data: {
        conferenciaId: itemEntity.conferenciaId,
        skuId: itemEntity.skuId,
        qtdSistema: itemEntity.qtdSistema,
        qtdConferencia: itemEntity.qtdConferencia,
        diferenca: itemEntity.diferenca,
        ajustado: itemEntity.ajustado,
      },
      include: {
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
        ConferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            status: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    });

    return this.mapToConferenciaItemEntity(item);
  }

  async findAll(): Promise<ConferenciaItem[]> {
    const itens = await this.prisma.conferenciaItem.findMany({
      include: {
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
        ConferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            status: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return itens.map(item => this.mapToConferenciaItemEntity(item));
  }

  async findByConferencia(conferenciaId: number): Promise<ConferenciaItem[]> {
    const itens = await this.prisma.conferenciaItem.findMany({
      where: { conferenciaId },
      include: {
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
        ConferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            status: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return itens.map(item => this.mapToConferenciaItemEntity(item));
  }

  async findOne(id: number): Promise<ConferenciaItem> {
    const item = await this.prisma.conferenciaItem.findUnique({
      where: { id },
      include: {
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
        ConferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            status: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item de conferência não encontrado');
    }

    return this.mapToConferenciaItemEntity(item);
  }

  async update(
    id: number,
    updateConferenciaItemDto: UpdateConferenciaItemDto,
  ): Promise<ConferenciaItem> {
    // Verificar se o item existe
    const existingItem = await this.prisma.conferenciaItem.findUnique({
      where: { id },
      include: {
        ConferenciaEstoque: true,
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Item de conferência não encontrado');
    }

    // Verificar se a conferência ainda pode ser editada
    if (existingItem.ConferenciaEstoque.status === 'FINALIZADA') {
      throw new BadRequestException(
        'Não é possível editar itens de uma conferência finalizada',
      );
    }

    // Validações adicionais se necessário
    if (updateConferenciaItemDto.conferenciaId) {
      await this.validateConferencia(updateConferenciaItemDto.conferenciaId);
    }

    if (updateConferenciaItemDto.skuId) {
      await this.validateSKU(updateConferenciaItemDto.skuId);
    }

    // Calcular nova diferença se necessário
    const qtdSistema =
      updateConferenciaItemDto.qtdSistema ?? existingItem.qtdSistema;
    const qtdConferencia =
      updateConferenciaItemDto.qtdConferencia ?? existingItem.qtdConferencia;
    const diferenca = qtdConferencia - qtdSistema;

    const item = await this.prisma.conferenciaItem.update({
      where: { id },
      data: {
        ...updateConferenciaItemDto,
        diferenca,
      },
      include: {
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
        ConferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            status: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    });

    return this.mapToConferenciaItemEntity(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.prisma.conferenciaItem.findUnique({
      where: { id },
      include: {
        ConferenciaEstoque: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item de conferência não encontrado');
    }

    // Verificar se a conferência ainda pode ser editada
    if (item.ConferenciaEstoque.status === 'FINALIZADA') {
      throw new BadRequestException(
        'Não é possível remover itens de uma conferência finalizada',
      );
    }

    await this.prisma.conferenciaItem.delete({
      where: { id },
    });
  }

  async ajustarEstoque(id: number, ajustar: boolean): Promise<ConferenciaItem> {
    const item = await this.prisma.conferenciaItem.findUnique({
      where: { id },
      include: {
        ConferenciaEstoque: {
          include: {
            LocalEstoque: true,
          },
        },
        ProdutoSKU: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item de conferência não encontrado');
    }

    if (item.ConferenciaEstoque.status === 'FINALIZADA') {
      throw new BadRequestException(
        'Não é possível ajustar itens de uma conferência finalizada',
      );
    }

    if (ajustar && item.diferenca !== 0) {
      // Ajustar estoque
      await this.prisma.estoqueSKU.upsert({
        where: {
          localId_skuId: {
            localId: item.ConferenciaEstoque.localEstoqueId,
            skuId: item.skuId,
          },
        },
        update: {
          qtd: item.qtdConferencia,
        },
        create: {
          localId: item.ConferenciaEstoque.localEstoqueId,
          skuId: item.skuId,
          qtd: item.qtdConferencia,
        },
      });

      // Criar movimento de estoque para auditoria
      await this.prisma.movimentoEstoque.create({
        data: {
          skuId: item.skuId,
          tipo: 'AJUSTE',
          qtd: Math.abs(item.diferenca),
          idUsuario: item.ConferenciaEstoque.usuarioResponsavel,
          localDestinoId:
            item.diferenca > 0 ? item.ConferenciaEstoque.localEstoqueId : null,
          localOrigemId:
            item.diferenca < 0 ? item.ConferenciaEstoque.localEstoqueId : null,
          observacao: `Ajuste por conferência de estoque - ID: ${item.ConferenciaEstoque.publicId}`,
        },
      });
    }

    // Marcar como ajustado
    const updatedItem = await this.prisma.conferenciaItem.update({
      where: { id },
      data: { ajustado: ajustar },
      include: {
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
        ConferenciaEstoque: {
          select: {
            id: true,
            publicId: true,
            status: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    });

    return this.mapToConferenciaItemEntity(updatedItem);
  }

  private async validateConferencia(conferenciaId: number): Promise<void> {
    const conferencia = await this.prisma.conferenciaEstoque.findUnique({
      where: { id: conferenciaId },
    });

    if (!conferencia) {
      throw new NotFoundException('Conferência de estoque não encontrada');
    }
  }

  private async validateSKU(skuId: number): Promise<void> {
    const sku = await this.prisma.produtoSKU.findUnique({
      where: { id: skuId },
    });

    if (!sku) {
      throw new NotFoundException('SKU do produto não encontrado');
    }
  }

  private async validateUniqueItem(
    conferenciaId: number,
    skuId: number,
  ): Promise<void> {
    const existingItem = await this.prisma.conferenciaItem.findFirst({
      where: {
        conferenciaId,
        skuId,
      },
    });

    if (existingItem) {
      throw new ConflictException(
        'Já existe um item para este SKU nesta conferência',
      );
    }
  }

  private async getQuantidadeEstoque(skuId: number): Promise<number> {
    const estoque = await this.prisma.estoqueSKU.findFirst({
      where: { skuId },
    });

    return estoque?.qtd || 0;
  }

  private mapToConferenciaItemEntity(data: any): ConferenciaItem {
    return new ConferenciaItem({
      id: data.id,
      conferenciaId: data.conferenciaId,
      skuId: data.skuId,
      qtdSistema: data.qtdSistema,
      qtdConferencia: data.qtdConferencia,
      diferenca: data.diferenca,
      ajustado: data.ajustado,
      sku: {
        id: data.ProdutoSKU?.id,
        cor: data.ProdutoSKU?.cor,
        tamanho: data.ProdutoSKU?.tamanho,
      },
      produto: {
        id: data.ProdutoSKU?.produto?.id,
        nome: data.ProdutoSKU?.produto?.nome,
      },
      ConferenciaEstoque: data.ConferenciaEstoque
        ? {
            id: data.ConferenciaEstoque.id,
            publicId: data.ConferenciaEstoque.publicId,
            status: data.ConferenciaEstoque.status,
            dataInicio: data.ConferenciaEstoque.dataInicio,
            dataFim: data.ConferenciaEstoque.dataFim,
          }
        : undefined,
    });
  }
}
