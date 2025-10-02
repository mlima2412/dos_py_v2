import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoSkuDto } from './dto/create-produto-sku.dto';
import { UpdateProdutoSkuDto } from './dto/update-produto-sku.dto';
import { ProdutoSKU } from './entities/produto-sku.entity';

@Injectable()
export class ProdutoSkuService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProdutoSkuDto: CreateProdutoSkuDto,
    parceiroId: number,
  ): Promise<ProdutoSKU> {
    // Verificar se produto existe e pertence ao parceiro
    await this.validateProdutoExists(createProdutoSkuDto.produtoId, parceiroId);

    // Criar entidade e validar regras de negócio
    const produtoSkuEntity = ProdutoSKU.create(createProdutoSkuDto);

    const produtoSku = await this.prisma.produtoSKU.create({
      data: {
        id: produtoSkuEntity.id,
        publicId: produtoSkuEntity.publicId,
        produtoId: produtoSkuEntity.produtoId,
        cor: produtoSkuEntity.cor,
        codCor: produtoSkuEntity.codCor,
        tamanho: produtoSkuEntity.tamanho,
        qtdMinima: produtoSkuEntity.qtdMinima,
        dataUltimaCompra: produtoSkuEntity.dataUltimaCompra,
      },
      include: {
        produto: {
          include: {
            categoria: true,
            Parceiro: true,
          },
        },
      },
    });

    return this.mapToProdutoSkuEntity(produtoSku);
  }

  async findAll(parceiroId: number): Promise<ProdutoSKU[]> {
    const produtoSkus = await this.prisma.produtoSKU.findMany({
      where: {
        produto: {
          parceiroId,
        },
      },
      include: {
        produto: {
          include: {
            categoria: true,
            Parceiro: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return produtoSkus.map(sku => this.mapToProdutoSkuEntity(sku));
  }

  async findOne(publicId: string, parceiroId: number): Promise<ProdutoSKU> {
    const produtoSku = await this.prisma.produtoSKU.findFirst({
      where: {
        publicId,
        produto: {
          parceiroId,
        },
      },
      include: {
        produto: {
          include: {
            categoria: true,
            Parceiro: true,
          },
        },
      },
    });

    if (!produtoSku) {
      throw new NotFoundException('SKU do produto não encontrado');
    }

    return this.mapToProdutoSkuEntity(produtoSku);
  }

  async findByProduto(
    produtoPublicId: string,
    parceiroId: number,
  ): Promise<ProdutoSKU[]> {
    // Primeiro verificar se o produto existe e pertence ao parceiro
    const produto = await this.prisma.produto.findFirst({
      where: {
        publicId: produtoPublicId,
        parceiroId,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    const produtoSkus = await this.prisma.produtoSKU.findMany({
      where: {
        produtoId: produto.id,
      },
      include: {
        produto: {
          include: {
            categoria: true,
            Parceiro: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return produtoSkus.map(sku => this.mapToProdutoSkuEntity(sku));
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    parceiroId: number;
    produtoId?: number;
    ativo?: boolean;
  }) {
    const { page, limit, search, parceiroId, produtoId, ativo } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro obrigatório por parceiro (através do produto)
    andConditions.push({
      produto: {
        parceiroId,
      },
    });

    // Filtro de busca (cor ou tamanho)
    if (search) {
      andConditions.push({
        OR: [
          { cor: { contains: search, mode: 'insensitive' } },
          { tamanho: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Filtro por produto
    if (produtoId) {
      andConditions.push({ produtoId });
    }

    // Filtro por status ativo (através do produto)
    if (ativo !== undefined) {
      andConditions.push({
        produto: {
          ativo,
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados paginados
    const [produtoSkus, total] = await Promise.all([
      this.prisma.produtoSKU.findMany({
        where,
        include: {
          produto: {
            include: {
              categoria: true,
              Parceiro: true,
            },
          },
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.produtoSKU.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: produtoSkus.map(sku => this.mapToProdutoSkuEntity(sku)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(
    publicId: string,
    updateProdutoSkuDto: UpdateProdutoSkuDto,
    parceiroId: number,
  ): Promise<ProdutoSKU> {
    // Verificar se SKU existe e pertence ao parceiro
    const existingSku = await this.prisma.produtoSKU.findFirst({
      where: {
        publicId,
        produto: {
          parceiroId,
        },
      },
    });

    if (!existingSku) {
      throw new NotFoundException('SKU do produto não encontrado');
    }

    const updateData: any = {};
    if (updateProdutoSkuDto.cor !== undefined)
      updateData.cor = updateProdutoSkuDto.cor;
    if (updateProdutoSkuDto.codCor !== undefined)
      updateData.codCor = updateProdutoSkuDto.codCor;
    if (updateProdutoSkuDto.tamanho !== undefined)
      updateData.tamanho = updateProdutoSkuDto.tamanho;
    if (updateProdutoSkuDto.qtdMinima !== undefined)
      updateData.qtdMinima = updateProdutoSkuDto.qtdMinima;

    const produtoSku = await this.prisma.produtoSKU.update({
      where: { id: existingSku.id },
      data: updateData,
      include: {
        produto: {
          include: {
            categoria: true,
            Parceiro: true,
          },
        },
      },
    });

    return this.mapToProdutoSkuEntity(produtoSku);
  }

  async remove(publicId: string, parceiroId: number): Promise<void> {
    // Verificar se SKU existe e pertence ao parceiro
    const existingSku = await this.prisma.produtoSKU.findFirst({
      where: {
        publicId,
        produto: {
          parceiroId,
        },
      },
    });

    if (!existingSku) {
      throw new NotFoundException('SKU do produto não encontrado');
    }

    await this.prisma.produtoSKU.delete({
      where: { id: existingSku.id },
    });
  }

  async updateDataUltimaCompra(
    publicId: string,
    parceiroId: number,
    data: Date,
  ): Promise<ProdutoSKU> {
    return this.update(publicId, { dataUltimaCompra: data }, parceiroId);
  }

  private async validateProdutoExists(
    produtoId: number,
    parceiroId: number,
  ): Promise<void> {
    const produto = await this.prisma.produto.findFirst({
      where: {
        id: produtoId,
        parceiroId,
      },
    });

    if (!produto) {
      throw new BadRequestException(
        'Produto não encontrado ou não pertence a esta organização',
      );
    }
  }

  private mapToProdutoSkuEntity(data: any): ProdutoSKU {
    return new ProdutoSKU({
      id: data.id,
      publicId: data.publicId,
      produtoId: data.produtoId,
      cor: data.cor,
      codCor: data.codCor,
      tamanho: data.tamanho,
      qtdMinima: data.qtdMinima,
      dataUltimaCompra: data.dataUltimaCompra,
      produto: data.produto,
    });
  }
}
