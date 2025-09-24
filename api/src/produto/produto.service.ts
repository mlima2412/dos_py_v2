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
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class ProdutoService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
  ) {}

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

    // Verificar se fornecedor existe (se fornecido)
    if (createProdutoDto.fornecedorId) {
      await this.validateFornecedorExists(createProdutoDto.fornecedorId, parceiroId);
    }

    // Verificar se currency existe (se fornecida)
    if (createProdutoDto.currencyId) {
      await this.validateCurrencyExists(createProdutoDto.currencyId);
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
        currencyId: produtoEntity.currencyId,
        precoVenda: new Decimal(produtoEntity.precoVenda),
        parceiroId: produtoEntity.parceiroId,
        fornecedorId: produtoEntity.fornecedorId,
      },
      include: {
        categoria: true,
        Parceiro: true,
        fornecedor: true,
        currency: true,
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
        fornecedor: true,
        currency: true,
        ProdutoSKU: true,
      },
      orderBy: { dataCadastro: 'desc' },
    });

    return produtos.map(produto => this.mapToProdutoEntity(produto));
  }

  async findOne(publicId: string, parceiroId: number): Promise<Produto> {
    const produto = await this.prisma.produto.findFirst({
      where: { publicId, parceiroId },
      include: {
        categoria: true,
        Parceiro: true,
        fornecedor: true,
        currency: true,
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
    const existingProduto = await this.prisma.produto.findFirst({
      where: { publicId, parceiroId },
    });

    if (!existingProduto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o nome é único (se está sendo alterado)
    if (updateProdutoDto.nome && updateProdutoDto.nome !== existingProduto.nome) {
      await this.validateUniqueNome(updateProdutoDto.nome, parceiroId, existingProduto.id);
    }

    // Verificar se categoria existe (se fornecida)
    if (updateProdutoDto.categoriaId) {
      await this.validateCategoriaExists(updateProdutoDto.categoriaId);
    }

    // Verificar se fornecedor existe (se fornecido)
    if (updateProdutoDto.fornecedorId) {
      await this.validateFornecedorExists(updateProdutoDto.fornecedorId, parceiroId);
    }

    // Verificar se currency existe (se fornecida)
    if (updateProdutoDto.currencyId) {
      await this.validateCurrencyExists(updateProdutoDto.currencyId);
    }

    const updateData: any = {};
    if (updateProdutoDto.nome !== undefined) updateData.nome = updateProdutoDto.nome;
    if (updateProdutoDto.descricao !== undefined) updateData.descricao = updateProdutoDto.descricao;
    if (updateProdutoDto.imgURL !== undefined) updateData.imgURL = updateProdutoDto.imgURL;
    if (updateProdutoDto.precoCompra !== undefined)
      updateData.precoCompra = new Decimal(updateProdutoDto.precoCompra);
    if (updateProdutoDto.precoVenda !== undefined)
      updateData.precoVenda = new Decimal(updateProdutoDto.precoVenda);
    if (updateProdutoDto.consignado !== undefined)
      updateData.consignado = updateProdutoDto.consignado;
    if (updateProdutoDto.categoriaId !== undefined)
      updateData.categoriaId = updateProdutoDto.categoriaId;
    if (updateProdutoDto.fornecedorId !== undefined)
      updateData.fornecedorId = updateProdutoDto.fornecedorId;
    if (updateProdutoDto.currencyId !== undefined)
      updateData.currencyId = updateProdutoDto.currencyId;
    if (updateProdutoDto.ativo !== undefined)
      updateData.ativo = updateProdutoDto.ativo;

    const produto = await this.prisma.produto.update({
      where: { id: existingProduto.id },
      data: updateData,
      include: {
        categoria: true,
        Parceiro: true,
        fornecedor: true,
        currency: true,
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
        fornecedor: true,
        currency: true,
        ProdutoSKU: true,
      },
      orderBy: { dataCadastro: 'desc' },
    });

    return produtos.map(produto => this.mapToProdutoEntity(produto));
  }

  async findByFornecedor(
    fornecedorPublicId: string,
    parceiroId: number,
  ): Promise<Produto[]> {
    // Primeiro buscar o fornecedor pelo publicId
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { publicId: fornecedorPublicId, parceiroId },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const produtos = await this.prisma.produto.findMany({
      where: {
        fornecedorId: fornecedor.id,
        parceiroId,
      },
      include: {
        categoria: true,
        Parceiro: true,
        fornecedor: true,
        currency: true,
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

    const whereCondition: any = {
      parceiroId,
    };

    if (search) {
      whereCondition.nome = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (categoriaId) {
      whereCondition.categoriaId = categoriaId;
    }

    if (ativo !== undefined) {
      whereCondition.ativo = ativo;
    }

    const [produtos, total] = await Promise.all([
      this.prisma.produto.findMany({
        where: whereCondition,
        include: {
          categoria: true,
          Parceiro: true,
          fornecedor: true,
          currency: true,
          ProdutoSKU: true,
        },
        orderBy: { dataCadastro: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.produto.count({
        where: whereCondition,
      }),
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
      throw new ConflictException('Nome do produto já está em uso nesta organização');
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

  private async validateFornecedorExists(fornecedorId: number, parceiroId: number): Promise<void> {
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { 
        id: fornecedorId,
        parceiroId, // Garantir que o fornecedor pertence ao parceiro
      },
    });

    if (!fornecedor) {
      throw new BadRequestException('Fornecedor não encontrado');
    }
  }

  private async validateCurrencyExists(currencyId: number): Promise<void> {
    const currency = await this.prisma.currency.findUnique({
      where: { id: currencyId },
    });

    if (!currency) {
      throw new BadRequestException('Moeda não encontrada');
    }

    if (!currency.ativo) {
      throw new BadRequestException('Moeda não está ativa');
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
      fornecedorId: data.fornecedorId,
      currencyId: data.currencyId,
      categoria: data.categoria,
      Parceiro: data.Parceiro,
      fornecedor: data.fornecedor,
      currency: data.currency,
      ProdutoSKU: data.ProdutoSKU,
    });
  }

  async findByLocal(
    localPublicId: string,
    parceiroId: number,
    apenasComEstoque: boolean = true,
    fornecedorPublicId?: string,
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

    let fornecedorId: number | undefined;

    // Se fornecedor foi especificado, buscar o ID interno
    if (fornecedorPublicId) {
      const fornecedor = await this.prisma.fornecedor.findFirst({
        where: {
          publicId: fornecedorPublicId,
          parceiroId,
        },
      });

      if (!fornecedor) {
        throw new NotFoundException('Fornecedor não encontrado');
      }

      fornecedorId = fornecedor.id;
    }

    const whereCondition: any = {
      parceiroId,
      ...(fornecedorId && { fornecedorId }),
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
        fornecedor: {
          select: {
            id: true,
            publicId: true,
            nome: true,
          },
        },
        currency: {
          select: {
            id: true,
            publicId: true,
            nome: true,
            prefixo: true,
            isoCode: true,
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
