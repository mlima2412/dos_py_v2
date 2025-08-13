import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { Despesa } from './entities/despesa.entity';

@Injectable()
export class DespesasService {
  constructor(private prisma: PrismaService) {}

  async create(createDespesaDto: CreateDespesaDto, parceiroId: number): Promise<Despesa> {
    // Verificar se o parceiro existe
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { id: parceiroId },
    });

    if (!parceiro) {
      throw new BadRequestException('Parceiro não encontrado');
    }

    // Verificar se a subcategoria existe
    const subCategoria = await this.prisma.subCategoriaDespesa.findUnique({
      where: { idSubCategoria: createDespesaDto.subCategoriaId },
    });

    if (!subCategoria) {
      throw new BadRequestException('Subcategoria não encontrada');
    }

    // Verificar se o fornecedor existe (se fornecido)
    if (createDespesaDto.fornecedorId) {
      const fornecedor = await this.prisma.fornecedor.findUnique({
        where: { id: createDespesaDto.fornecedorId },
      });

      if (!fornecedor) {
        throw new BadRequestException('Fornecedor não encontrado');
      }
    }

    // Criar instância da entidade com valores padrão
    const despesaEntity = Despesa.create({
      valor: createDespesaDto.valor,
      descricao: createDespesaDto.descricao,
      subCategoriaId: createDespesaDto.subCategoriaId,
      parceiroId: parceiroId,
      fornecedorId: createDespesaDto.fornecedorId,
      currencyId: createDespesaDto.currencyId,
      cotacao: createDespesaDto.cotacao,
    });

    const despesa = await this.prisma.despesa.create({
      data: {
        publicId: despesaEntity.publicId,
        dataDespesa: createDespesaDto.dataDespesa ? new Date(createDespesaDto.dataDespesa) : new Date(),
        valor: createDespesaDto.valor,
        descricao: createDespesaDto.descricao,
        subCategoriaId: createDespesaDto.subCategoriaId,
        parceiroId: parceiroId,
        fornecedorId: createDespesaDto.fornecedorId,
        dataVencimento: createDespesaDto.dataVencimento ? new Date(createDespesaDto.dataVencimento) : null,
        dataPagamento: createDespesaDto.dataPagamento ? new Date(createDespesaDto.dataPagamento) : null,
        currencyId: createDespesaDto.currencyId,
        cotacao: createDespesaDto.cotacao,
      },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
    });

    return {
      ...despesa,
      valor: Number(despesa.valor),
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
    } as Despesa;
  }

  async findAll(): Promise<Despesa[]> {
    const despesas = await this.prisma.despesa.findMany({
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
      orderBy: { dataDespesa: 'desc' },
    });
    return despesas.map(despesa => ({
      ...despesa,
      valor: Number(despesa.valor),
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
    })) as Despesa[];
  }

  async findOne(publicId: string, parceiroId: number): Promise<Despesa> {
    const despesa = await this.prisma.despesa.findFirst({
      where: { 
        publicId,
        parceiroId 
      },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
    });

    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada');
    }

    return {
      ...despesa,
      valor: Number(despesa.valor),
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
    } as Despesa;
  }

  async findByParceiro(parceiroId: number): Promise<Despesa[]> {
    const despesas = await this.prisma.despesa.findMany({
      where: { parceiroId },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
      orderBy: { dataDespesa: 'desc' }, // Ordenação decrescente conforme solicitado
    });
    return despesas.map(despesa => ({
      ...despesa,
      valor: Number(despesa.valor),
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
    })) as Despesa[];
  }



  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    parceiroId: number;
    fornecedorId?: number;
    subCategoriaId?: number;
  }) {
    const { page, limit, search, parceiroId, fornecedorId, subCategoriaId } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro obrigatório por parceiro
    andConditions.push({ parceiroId });

    // Filtro de busca (descrição)
    if (search) {
      andConditions.push({
        descricao: { contains: search, mode: 'insensitive' },
      });
    }

    // Filtro por fornecedor
    if (fornecedorId) {
      andConditions.push({ fornecedorId });
    }

    // Filtro por subcategoria
    if (subCategoriaId) {
      andConditions.push({ subCategoriaId });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados paginados
    const [despesas, total] = await Promise.all([
      this.prisma.despesa.findMany({
        where,
        include: {
          parceiro: true,
          fornecedor: true,
          subCategoria: true,
        },
        orderBy: { dataDespesa: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.despesa.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: despesas.map(despesa => ({
        ...despesa,
        valor: Number(despesa.valor),
        cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
      })) as Despesa[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(publicId: string, updateDespesaDto: UpdateDespesaDto, parceiroId: number): Promise<Despesa> {
    // Verificar se a despesa existe e pertence ao parceiro
    const existingDespesa = await this.prisma.despesa.findFirst({
      where: { 
        publicId,
        parceiroId 
      },
    });

    if (!existingDespesa) {
      throw new NotFoundException('Despesa não encontrada');
    }

    // Verificar se a subcategoria existe (se fornecida)
    if (updateDespesaDto.subCategoriaId) {
      const subCategoria = await this.prisma.subCategoriaDespesa.findUnique({
        where: { idSubCategoria: updateDespesaDto.subCategoriaId },
      });

      if (!subCategoria) {
        throw new BadRequestException('Subcategoria não encontrada');
      }
    }

    // Verificar se o fornecedor existe (se fornecido)
    if (updateDespesaDto.fornecedorId) {
      const fornecedor = await this.prisma.fornecedor.findUnique({
        where: { id: updateDespesaDto.fornecedorId },
      });

      if (!fornecedor) {
        throw new BadRequestException('Fornecedor não encontrado');
      }
    }

    const updateData: any = {};
    
    if (updateDespesaDto.dataDespesa) updateData.dataDespesa = new Date(updateDespesaDto.dataDespesa);
    if (updateDespesaDto.valor !== undefined) updateData.valor = updateDespesaDto.valor;
    if (updateDespesaDto.descricao) updateData.descricao = updateDespesaDto.descricao;
    if (updateDespesaDto.subCategoriaId) updateData.subCategoriaId = updateDespesaDto.subCategoriaId;
    if (updateDespesaDto.fornecedorId !== undefined) updateData.fornecedorId = updateDespesaDto.fornecedorId;
    if (updateDespesaDto.dataVencimento) updateData.dataVencimento = new Date(updateDespesaDto.dataVencimento);
    if (updateDespesaDto.dataPagamento) updateData.dataPagamento = new Date(updateDespesaDto.dataPagamento);
    if (updateDespesaDto.currencyId !== undefined) updateData.currencyId = updateDespesaDto.currencyId;
    if (updateDespesaDto.cotacao !== undefined) updateData.cotacao = updateDespesaDto.cotacao;

    const despesa = await this.prisma.despesa.update({
      where: { publicId },
      data: updateData,
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
    });

    return {
      ...despesa,
      valor: Number(despesa.valor),
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
    } as Despesa;
  }

  async remove(publicId: string, parceiroId: number): Promise<void> {
    // Verificar se a despesa existe e pertence ao parceiro
    const existingDespesa = await this.prisma.despesa.findFirst({
      where: { 
        publicId,
        parceiroId 
      },
    });

    if (!existingDespesa) {
      throw new NotFoundException('Despesa não encontrada');
    }

    await this.prisma.despesa.delete({
      where: { id: existingDespesa.id },
    });
  }
}