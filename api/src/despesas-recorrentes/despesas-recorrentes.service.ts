import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DespesaRecorrente } from './entities/despesa-recorrente.entity';
import { CreateDespesaRecorrenteDto } from './dto/create-despesa-recorrente.dto';
import { UpdateDespesaRecorrenteDto } from './dto/update-despesa-recorrente.dto';

@Injectable()
export class DespesasRecorrentesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDespesaRecorrenteDto: CreateDespesaRecorrenteDto): Promise<DespesaRecorrente> {
    // Validar se o parceiro existe
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { id: createDespesaRecorrenteDto.parceiroId },
    });
    if (!parceiro) {
      throw new BadRequestException('Parceiro não encontrado');
    }

    // Validar se a subcategoria existe
    const subCategoria = await this.prisma.subCategoriaDespesa.findUnique({
      where: { idSubCategoria: createDespesaRecorrenteDto.subCategoriaId },
    });
    if (!subCategoria) {
      throw new BadRequestException('Subcategoria não encontrada');
    }

    // Validar se o fornecedor existe (se fornecido)
    if (createDespesaRecorrenteDto.fornecedorId) {
      const fornecedor = await this.prisma.fornecedor.findUnique({
        where: { id: createDespesaRecorrenteDto.fornecedorId },
      });
      if (!fornecedor) {
        throw new BadRequestException('Fornecedor não encontrado');
      }
    }

    // Criar instância da entidade com valores padrão
    const despesaRecorrenteEntity = DespesaRecorrente.create({
      valor: createDespesaRecorrenteDto.valor,
      descricao: createDespesaRecorrenteDto.descricao,
      frequencia: createDespesaRecorrenteDto.frequencia,
      diaVencimento: createDespesaRecorrenteDto.diaVencimento,
      subCategoriaId: createDespesaRecorrenteDto.subCategoriaId,
      parceiroId: createDespesaRecorrenteDto.parceiroId,
      fornecedorId: createDespesaRecorrenteDto.fornecedorId,
      currencyId: createDespesaRecorrenteDto.currencyId,
      cotacao: createDespesaRecorrenteDto.cotacao,
    });

    const despesaRecorrente = await this.prisma.despesaRecorrente.create({
      data: {
        publicId: despesaRecorrenteEntity.publicId,
        descricao: createDespesaRecorrenteDto.descricao,
        valor: createDespesaRecorrenteDto.valor,
        frequencia: createDespesaRecorrenteDto.frequencia || 'MENSAL',
        diaVencimento: createDespesaRecorrenteDto.diaVencimento,
        dataInicio: createDespesaRecorrenteDto.dataInicio ? new Date(createDespesaRecorrenteDto.dataInicio) : new Date(),
        dataFim: createDespesaRecorrenteDto.dataFim ? new Date(createDespesaRecorrenteDto.dataFim) : null,
        subCategoriaId: createDespesaRecorrenteDto.subCategoriaId,
        parceiroId: createDespesaRecorrenteDto.parceiroId,
        fornecedorId: createDespesaRecorrenteDto.fornecedorId,
        currencyId: createDespesaRecorrenteDto.currencyId,
        cotacao: createDespesaRecorrenteDto.cotacao,
      },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
    });

    return {
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    } as DespesaRecorrente;
  }

  async findAll(): Promise<DespesaRecorrente[]> {
    const despesasRecorrentes = await this.prisma.despesaRecorrente.findMany({
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      }
    });
    return despesasRecorrentes.map(despesaRecorrente => ({
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    })) as DespesaRecorrente[];
  }

  async findOne(publicId: string): Promise<DespesaRecorrente> {
    const despesaRecorrente = await this.prisma.despesaRecorrente.findUnique({
      where: { publicId },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
    });

    if (!despesaRecorrente) {
      throw new NotFoundException('Despesa recorrente não encontrada');
    }

    return {
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    } as DespesaRecorrente;
  }

  async findByParceiro(parceiroId: number): Promise<DespesaRecorrente[]> {
    const despesasRecorrentes = await this.prisma.despesaRecorrente.findMany({
      where: { parceiroId },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      }
    });
    return despesasRecorrentes.map(despesaRecorrente => ({
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    })) as DespesaRecorrente[];
  }

  async findByFornecedor(fornecedorId: number): Promise<DespesaRecorrente[]> {
    const despesasRecorrentes = await this.prisma.despesaRecorrente.findMany({
      where: { fornecedorId },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      }
    });
    return despesasRecorrentes.map(despesaRecorrente => ({
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    })) as DespesaRecorrente[];
  }

  async findBySubCategoria(subCategoriaId: number): Promise<DespesaRecorrente[]> {
    const despesasRecorrentes = await this.prisma.despesaRecorrente.findMany({
      where: { subCategoriaId },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      }
    });
    return despesasRecorrentes.map(despesaRecorrente => ({
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    })) as DespesaRecorrente[];
  }

  async findByFrequencia(frequencia: any): Promise<DespesaRecorrente[]> {
    const despesasRecorrentes = await this.prisma.despesaRecorrente.findMany({
      where: { frequencia },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      }
    });
    return despesasRecorrentes.map(despesaRecorrente => ({
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    })) as DespesaRecorrente[];
  }

  async update(publicId: string, updateDespesaRecorrenteDto: UpdateDespesaRecorrenteDto): Promise<DespesaRecorrente> {
    // Verificar se a despesa recorrente existe
    const despesaRecorrenteExistente = await this.prisma.despesaRecorrente.findUnique({
      where: { publicId },
    });

    if (!despesaRecorrenteExistente) {
      throw new NotFoundException('Despesa recorrente não encontrada');
    }

    // Validar se o parceiro existe (se fornecido)
    if (updateDespesaRecorrenteDto.parceiroId) {
      const parceiro = await this.prisma.parceiro.findUnique({
        where: { id: updateDespesaRecorrenteDto.parceiroId },
      });
      if (!parceiro) {
        throw new BadRequestException('Parceiro não encontrado');
      }
    }

    // Validar se a subcategoria existe (se fornecida)
    if (updateDespesaRecorrenteDto.subCategoriaId) {
      const subCategoria = await this.prisma.subCategoriaDespesa.findUnique({
        where: { idSubCategoria: updateDespesaRecorrenteDto.subCategoriaId },
      });
      if (!subCategoria) {
        throw new BadRequestException('Subcategoria não encontrada');
      }
    }

    // Validar se o fornecedor existe (se fornecido)
    if (updateDespesaRecorrenteDto.fornecedorId) {
      const fornecedor = await this.prisma.fornecedor.findUnique({
        where: { id: updateDespesaRecorrenteDto.fornecedorId },
      });
      if (!fornecedor) {
        throw new BadRequestException('Fornecedor não encontrado');
      }
    }

    const updateData: any = {};
    

    if (updateDespesaRecorrenteDto.descricao !== undefined) {
      updateData.descricao = updateDespesaRecorrenteDto.descricao;
    }
    if (updateDespesaRecorrenteDto.valor !== undefined) {
      updateData.valor = updateDespesaRecorrenteDto.valor;
    }
    if (updateDespesaRecorrenteDto.frequencia !== undefined) {
      updateData.frequencia = updateDespesaRecorrenteDto.frequencia;
    }
    if (updateDespesaRecorrenteDto.diaVencimento !== undefined) {
      updateData.diaVencimento = updateDespesaRecorrenteDto.diaVencimento;
    }
    if (updateDespesaRecorrenteDto.dataInicio) {
      updateData.dataInicio = new Date(updateDespesaRecorrenteDto.dataInicio);
    }
    if (updateDespesaRecorrenteDto.dataFim) {
      updateData.dataFim = new Date(updateDespesaRecorrenteDto.dataFim);
    }
    if (updateDespesaRecorrenteDto.subCategoriaId !== undefined) {
      updateData.subCategoriaId = updateDespesaRecorrenteDto.subCategoriaId;
    }
    if (updateDespesaRecorrenteDto.parceiroId !== undefined) {
      updateData.parceiroId = updateDespesaRecorrenteDto.parceiroId;
    }
    if (updateDespesaRecorrenteDto.fornecedorId !== undefined) {
      updateData.fornecedorId = updateDespesaRecorrenteDto.fornecedorId;
    }
    if (updateDespesaRecorrenteDto.currencyId !== undefined) {
      updateData.currencyId = updateDespesaRecorrenteDto.currencyId;
    }
    if (updateDespesaRecorrenteDto.cotacao !== undefined) {
      updateData.cotacao = updateDespesaRecorrenteDto.cotacao;
    }

    const despesaRecorrente = await this.prisma.despesaRecorrente.update({
      where: { publicId },
      data: updateData,
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
      },
    });

    return {
      ...despesaRecorrente,
      valor: Number(despesaRecorrente.valor),
      cotacao: despesaRecorrente.cotacao ? Number(despesaRecorrente.cotacao) : null,
    } as DespesaRecorrente;
  }

  async remove(publicId: string): Promise<void> {
    const despesaRecorrente = await this.prisma.despesaRecorrente.findUnique({
      where: { publicId },
    });

    if (!despesaRecorrente) {
      throw new NotFoundException('Despesa recorrente não encontrada');
    }

    await this.prisma.despesaRecorrente.delete({
      where: { publicId },
    });
  }
}