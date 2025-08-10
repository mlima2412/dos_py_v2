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

  async create(createDespesaDto: CreateDespesaDto): Promise<Despesa> {
    // Verificar se o parceiro existe
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { id: createDespesaDto.parceiroId },
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
      parceiroId: createDespesaDto.parceiroId,
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
        parceiroId: createDespesaDto.parceiroId,
        fornecedorId: createDespesaDto.fornecedorId,
        dataVencimento: createDespesaDto.dataVencimento ? new Date(createDespesaDto.dataVencimento) : new Date(),
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

  async findOne(publicId: string): Promise<Despesa> {
    const despesa = await this.prisma.despesa.findUnique({
      where: { publicId },
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

  async findByFornecedor(fornecedorId: number): Promise<Despesa[]> {
    const despesas = await this.prisma.despesa.findMany({
      where: { fornecedorId },
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

  async findBySubCategoria(subCategoriaId: number): Promise<Despesa[]> {
    const despesas = await this.prisma.despesa.findMany({
      where: { subCategoriaId },
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

  async update(publicId: string, updateDespesaDto: UpdateDespesaDto): Promise<Despesa> {
    // Verificar se a despesa existe
    const existingDespesa = await this.prisma.despesa.findUnique({
      where: { publicId },
    });

    if (!existingDespesa) {
      throw new NotFoundException('Despesa não encontrada');
    }

    // Verificar se o parceiro existe (se fornecido)
    if (updateDespesaDto.parceiroId) {
      const parceiro = await this.prisma.parceiro.findUnique({
        where: { id: updateDespesaDto.parceiroId },
      });

      if (!parceiro) {
        throw new BadRequestException('Parceiro não encontrado');
      }
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
    if (updateDespesaDto.parceiroId) updateData.parceiroId = updateDespesaDto.parceiroId;
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

  async remove(publicId: string): Promise<void> {
    const despesa = await this.prisma.despesa.findUnique({
      where: { publicId },
    });

    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada');
    }

    await this.prisma.despesa.delete({
      where: { publicId },
    });
  }
}