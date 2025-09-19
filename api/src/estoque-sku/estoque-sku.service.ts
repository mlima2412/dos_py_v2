import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstoqueSkuDto } from './dto/create-estoque-sku.dto';
import { UpdateEstoqueSkuDto } from './dto/update-estoque-sku.dto';
import { EstoqueSku } from './entities/estoque-sku.entity';

@Injectable()
export class EstoqueSkuService {
  constructor(private prisma: PrismaService) {}

  async create(createEstoqueSkuDto: CreateEstoqueSkuDto): Promise<EstoqueSku> {
    // Verificar se o SKU existe
    const sku = await this.prisma.produtoSKU.findUnique({
      where: { id: createEstoqueSkuDto.skuId },
    });

    if (!sku) {
      throw new NotFoundException('SKU não encontrado');
    }

    // Verificar se o local existe
    const local = await this.prisma.localEstoque.findUnique({
      where: { id: createEstoqueSkuDto.localId },
    });

    if (!local) {
      throw new NotFoundException('Local de estoque não encontrado');
    }

    // Verificar se já existe estoque para este SKU neste local
    const existingEstoque = await this.prisma.estoqueSKU.findUnique({
      where: {
        localId_skuId: {
          localId: createEstoqueSkuDto.localId,
          skuId: createEstoqueSkuDto.skuId,
        },
      },
    });

    if (existingEstoque) {
      throw new ConflictException(
        'Já existe registro de estoque para este SKU neste local',
      );
    }

    const estoqueSku = await this.prisma.estoqueSKU.create({
      data: createEstoqueSkuDto,
      include: {
        sku: {
          include: {
            produto: true,
          },
        },
        local: true,
      },
    });

    return this.mapToEstoqueSkuEntity(estoqueSku);
  }

  async findAll(): Promise<EstoqueSku[]> {
    const estoques = await this.prisma.estoqueSKU.findMany({
      include: {
        sku: {
          include: {
            produto: true,
          },
        },
        local: true,
      },
      orderBy: [
        { local: { nome: 'asc' } },
        { sku: { produto: { nome: 'asc' } } },
      ],
    });

    return estoques.map(estoque => this.mapToEstoqueSkuEntity(estoque));
  }

  async findByLocal(localId: number): Promise<EstoqueSku[]> {
    const estoques = await this.prisma.estoqueSKU.findMany({
      where: { localId },
      include: {
        sku: {
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
        local: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { sku: { produto: { nome: 'asc' } } },
    });

    return estoques.map(estoque => this.mapToEstoqueSkuEntity(estoque));
  }

  async findBySku(skuId: number): Promise<EstoqueSku[]> {
    const estoques = await this.prisma.estoqueSKU.findMany({
      where: { skuId },
      include: {
        sku: {
          include: {
            produto: true,
          },
        },
        local: true,
      },
      orderBy: { local: { nome: 'asc' } },
    });

    return estoques.map(estoque => this.mapToEstoqueSkuEntity(estoque));
  }

  async findOne(localId: number, skuId: number): Promise<EstoqueSku> {
    const estoqueSku = await this.prisma.estoqueSKU.findUnique({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
      include: {
        sku: {
          include: {
            produto: true,
          },
        },
        local: true,
      },
    });

    if (!estoqueSku) {
      throw new NotFoundException('Registro de estoque não encontrado');
    }

    return this.mapToEstoqueSkuEntity(estoqueSku);
  }

  async update(
    localId: number,
    skuId: number,
    updateEstoqueSkuDto: UpdateEstoqueSkuDto,
  ): Promise<EstoqueSku> {
    // Verificar se o registro existe
    const existingEstoque = await this.prisma.estoqueSKU.findUnique({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
    });

    if (!existingEstoque) {
      throw new NotFoundException('Registro de estoque não encontrado');
    }

    const estoqueSku = await this.prisma.estoqueSKU.update({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
      data: updateEstoqueSkuDto,
      include: {
        sku: {
          include: {
            produto: true,
          },
        },
        local: true,
      },
    });

    return this.mapToEstoqueSkuEntity(estoqueSku);
  }

  async remove(localId: number, skuId: number): Promise<void> {
    const existingEstoque = await this.prisma.estoqueSKU.findUnique({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
    });

    if (!existingEstoque) {
      throw new NotFoundException('Registro de estoque não encontrado');
    }

    await this.prisma.estoqueSKU.delete({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
    });
  }

  async adjustQuantity(
    localId: number,
    skuId: number,
    adjustment: number,
  ): Promise<EstoqueSku> {
    const existingEstoque = await this.prisma.estoqueSKU.findUnique({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
    });

    if (!existingEstoque) {
      throw new NotFoundException('Registro de estoque não encontrado');
    }

    const newQuantity = existingEstoque.qtd + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Ajuste resultaria em quantidade negativa');
    }

    const estoqueSku = await this.prisma.estoqueSKU.update({
      where: {
        localId_skuId: {
          localId,
          skuId,
        },
      },
      data: { qtd: newQuantity },
      include: {
        sku: {
          include: {
            produto: true,
          },
        },
        local: true,
      },
    });

    return this.mapToEstoqueSkuEntity(estoqueSku);
  }

  private mapToEstoqueSkuEntity(data: any): EstoqueSku {
    return {
      skuId: data.skuId,
      localId: data.localId,
      qtd: data.qtd,
      sku: data.sku,
      local: data.local,
    } as EstoqueSku;
  }
}
