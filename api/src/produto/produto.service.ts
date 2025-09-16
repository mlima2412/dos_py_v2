import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProdutoService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProdutoDto: CreateProdutoDto,
    parceiroId: number,
  ): Promise<Produto> {
    // Verificar se já existe produto com mesmo nome no parceiro
    await this.validateUniqueNome(createProdutoDto.nome, parceiroId);

    // Verificar se categoria existe (se fornecida)
    if (createProdutoDto.categoriaId) {
      await this.validateCategoriaExists(createProdutoDto.categoriaId);
    }

    // Criar entidade e validar regras de negócio
    const produtoEntity = Produto.create({
      ...createProdutoDto,
      parceiroId,
    });

    const produto = await this.prisma.produto.create({
      data: {
        id: produtoEntity.id,
        publicId: produtoEntity.publicId,
        nome: produtoEntity.nome,
        dataCadastro: produtoEntity.dataCadastro,
        ativo: produtoEntity.ativo,
        consignado: produtoEntity.consignado,
        categoriaId: produtoEntity.categoriaId,
        descricao: produtoEntity.descricao,
        imgURL: produtoEntity.imgURL,
        precoCompra: new Decimal(produtoEntity.precoCompra),
        precoVenda: new Decimal(produtoEntity.precoVenda),
        parceiroId: produtoEntity.parceiroId,
      },
      include: {
        categoria: true,
        Parceiro: true,
        ProdutoSKU: true,
      },
    });

    return this.mapToProdutoEntity(produto);
  }

  async findAll(parceiroId: number): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({
      where: { parceiroId },
      include: {
        categoria: true,
        Parceiro: true,
        ProdutoSKU: true,
      },
      orderBy: { dataCadastro: 'desc' },
    });

    return produtos.map(produto => this.mapToProdutoEntity(produto));
  }

  async findOne(publicId: string, parceiroId: number): Promise<Produto> {
    const produto = await this.prisma.produto.findFirst({
      where: {
        publicId,
        parceiroId,
      },
      include: {
        categoria: true,
        Parceiro: true,
        ProdutoSKU: true,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.mapToProdutoEntity(produto);
  }

  async update(
    publicId: string,
    updateProdutoDto: UpdateProdutoDto,
    parceiroId: number,
  ): Promise<Produto> {
    // Verificar se produto existe
    const existingProduto = await this.prisma.produto.findFirst({
      where: { publicId, parceiroId },
    });

    if (!existingProduto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar nome único se está sendo alterado
    if (
      updateProdutoDto.nome &&
      updateProdutoDto.nome !== existingProduto.nome
    ) {
      await this.validateUniqueNome(
        updateProdutoDto.nome,
        parceiroId,
        existingProduto.id,
      );
    }

    // Verificar se categoria existe (se fornecida)
    if (updateProdutoDto.categoriaId) {
      await this.validateCategoriaExists(updateProdutoDto.categoriaId);
    }

    const updateData: any = {};
    if (updateProdutoDto.nome !== undefined)
      updateData.nome = updateProdutoDto.nome;
    if (updateProdutoDto.descricao !== undefined)
      updateData.descricao = updateProdutoDto.descricao;
    if (updateProdutoDto.imgURL !== undefined)
      updateData.imgURL = updateProdutoDto.imgURL;
    if (updateProdutoDto.precoCompra !== undefined)
      updateData.precoCompra = new Decimal(updateProdutoDto.precoCompra);
    if (updateProdutoDto.precoVenda !== undefined)
      updateData.precoVenda = new Decimal(updateProdutoDto.precoVenda);
    if (updateProdutoDto.consignado !== undefined)
      updateData.consignado = updateProdutoDto.consignado;
    if (updateProdutoDto.categoriaId !== undefined)
      updateData.categoriaId = updateProdutoDto.categoriaId;
    if (updateProdutoDto.ativo !== undefined)
      updateData.ativo = updateProdutoDto.ativo;

    const produto = await this.prisma.produto.update({
      where: { id: existingProduto.id },
      data: updateData,
      include: {
        categoria: true,
        Parceiro: true,
        ProdutoSKU: true,
      },
    });

    return this.mapToProdutoEntity(produto);
  }

  async activate(publicId: string, parceiroId: number): Promise<Produto> {
    return this.update(publicId, { ativo: true }, parceiroId);
  }

  async deactivate(publicId: string, parceiroId: number): Promise<Produto> {
    return this.update(publicId, { ativo: false }, parceiroId);
  }

  async findByCategoria(
    categoriaId: number,
    parceiroId: number,
  ): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({
      where: {
        categoriaId,
        parceiroId,
      },
      include: {
        categoria: true,
        Parceiro: true,
        ProdutoSKU: true,
      },
      orderBy: { dataCadastro: 'desc' },
    });

    return produtos.map(produto => this.mapToProdutoEntity(produto));
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    parceiroId: number;
    categoriaId?: number;
    ativo?: boolean;
  }) {
    const { page, limit, search, parceiroId, categoriaId, ativo } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro obrigatório por parceiro
    andConditions.push({ parceiroId });

    // Filtro de busca (nome do produto)
    if (search) {
      andConditions.push({
        nome: { contains: search, mode: 'insensitive' },
      });
    }

    // Filtro por categoria
    if (categoriaId) {
      andConditions.push({ categoriaId });
    }

    // Filtro por status ativo
    if (ativo !== undefined) {
      andConditions.push({ ativo });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados paginados
    const [produtos, total] = await Promise.all([
      this.prisma.produto.findMany({
        where,
        include: {
          categoria: true,
          Parceiro: true,
          ProdutoSKU: {
            select: {
              id: true,
              publicId: true,
              cor: true,
              tamanho: true,
            },
          },
        },
        orderBy: { dataCadastro: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.produto.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: produtos.map(produto => this.mapToProdutoEntity(produto)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  private async validateUniqueNome(
    nome: string,
    parceiroId: number,
    excludeId?: number,
  ): Promise<void> {
    const existingProduto = await this.prisma.produto.findFirst({
      where: {
        nome,
        parceiroId,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existingProduto) {
      throw new ConflictException(
        'Já existe um produto com este nome nesta organização',
      );
    }
  }

  private async validateCategoriaExists(categoriaId: number): Promise<void> {
    const categoria = await this.prisma.categoriaProduto.findUnique({
      where: { id: categoriaId },
    });

    if (!categoria) {
      throw new BadRequestException('Categoria não encontrada');
    }
  }

  private mapToProdutoEntity(data: any): Produto {
    return new Produto({
      id: data.id,
      publicId: data.publicId,
      nome: data.nome,
      dataCadastro: data.dataCadastro,
      ativo: data.ativo,
      consignado: data.consignado,
      categoriaId: data.categoriaId,
      descricao: data.descricao,
      imgURL: data.imgURL,
      precoCompra: Number(data.precoCompra),
      precoVenda: Number(data.precoVenda),
      parceiroId: data.parceiroId,
      categoria: data.categoria,
      Parceiro: data.Parceiro,
      ProdutoSKU: data.ProdutoSKU,
    });
  }

  async findByLocal(
    localPublicId: string,
    parceiroId: number,
    apenasComEstoque: boolean = true,
  ): Promise<any[]> {
    // Primeiro, buscar o local pelo publicId para obter o ID interno
    const local = await this.prisma.localEstoque.findFirst({
      where: {
        publicId: localPublicId,
        parceiroId, // Garantir que o local pertence ao parceiro
      },
    });

    if (!local) {
      throw new NotFoundException('Local de estoque não encontrado');
    }

    const whereCondition: any = {
      parceiroId,
      ProdutoSKU: {
        some: {
          EstoqueSKU: {
            some: {
              localId: local.id,
              ...(apenasComEstoque && { qtd: { gt: 0 } }),
            },
          },
        },
      },
    };

    const produtos = await this.prisma.produto.findMany({
      where: whereCondition,
      select: {
        id: true,
        publicId: true,
        nome: true,
        descricao: true,
        imgURL: true,
        precoVenda: true,
        precoCompra: true,
        ativo: true,
        consignado: true,
        categoria: {
          select: {
            id: true,
            descricao: true,
          },
        },
        ProdutoSKU: {
          where: {
            EstoqueSKU: {
              some: {
                localId: local.id,
              },
            },
          },
          select: {
            id: true,
            publicId: true,
            cor: true,
            tamanho: true,
            codCor: true,
            qtdMinima: true,
            EstoqueSKU: {
              where: {
                localId: local.id,
              },
              select: {
                qtd: true,
              },
            },
          },
          orderBy: { cor: 'asc' },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Transformar os dados para incluir informações de estoque de forma mais clara
    return produtos.map(produto => ({
      ...produto,
      precoVenda: Number(produto.precoVenda),
      precoCompra: Number(produto.precoCompra),
      ProdutoSKU: produto.ProdutoSKU.map(sku => ({
        ...sku,
        estoque: sku.EstoqueSKU[0]?.qtd || 0,
      })).map(({ ...rest }) => rest),
    }));
  }
}
