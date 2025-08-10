import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContasPagarDto } from './dto/create-contas-pagar.dto';
import { UpdateContasPagarDto } from './dto/update-contas-pagar.dto';
import { ContasPagar } from './entities/contas-pagar.entity';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class ContasPagarService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContasPagarDto: CreateContasPagarDto): Promise<ContasPagar> {
    // Verificar se o parceiro existe
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { id: createContasPagarDto.parceiroId },
    });

    if (!parceiro) {
      throw new BadRequestException('Parceiro não encontrado');
    }

    const contasPagar = await this.prisma.contasPagar.create({
      data: {
        publicId: uuidv7(),
        parceiroId: createContasPagarDto.parceiroId,
        origemTipo: createContasPagarDto.origemTipo,
        origemId: createContasPagarDto.origemId,
        dataVencimento: new Date(createContasPagarDto.dataVencimento),
        valorTotal: createContasPagarDto.valorTotal,
        saldo: createContasPagarDto.saldo || 0,
        descricao: createContasPagarDto.descricao,
        pago: createContasPagarDto.pago || false,
        currencyId: createContasPagarDto.currencyId,
        cotacao: createContasPagarDto.cotacao,
        dataPagamento: createContasPagarDto.dataPagamento ? new Date(createContasPagarDto.dataPagamento) : null,
      },
      include: {
        Parceiro: true,
        ContasPagarParcelas: true,
      },
    });

    return new ContasPagar({
      ...contasPagar,
      valorTotal: Number(contasPagar.valorTotal),
      saldo: Number(contasPagar.saldo),
      cotacao: Number(contasPagar.cotacao),
      parceiro: contasPagar.Parceiro,
      contasPagarParcelas: contasPagar.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
        cotacao: Number(parcela.cotacao),
      })),
    });
  }

  async findAll(): Promise<ContasPagar[]> {
    const contasPagar = await this.prisma.contasPagar.findMany({
      include: {
        Parceiro: true,
        ContasPagarParcelas: true,
      },
      orderBy: { dataVencimento: 'desc' },
    });

    return contasPagar.map(conta => new ContasPagar({
      ...conta,
      valorTotal: Number(conta.valorTotal),
      saldo: Number(conta.saldo),
      cotacao: Number(conta.cotacao),
      parceiro: conta.Parceiro,
      contasPagarParcelas: conta.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
        cotacao: Number(parcela.cotacao),
      })),
    }));
  }

  async findOne(publicId: string): Promise<ContasPagar> {
    const contasPagar = await this.prisma.contasPagar.findUnique({
      where: { publicId },
      include: {
        Parceiro: true,
        ContasPagarParcelas: true,
      },
    });

    if (!contasPagar) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    return new ContasPagar({
      ...contasPagar,
      valorTotal: Number(contasPagar.valorTotal),
      saldo: Number(contasPagar.saldo),
      cotacao: Number(contasPagar.cotacao),
      parceiro: contasPagar.Parceiro,
      contasPagarParcelas: contasPagar.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
        cotacao: Number(parcela.cotacao),
      })),
    });
  }

  async update(publicId: string, updateContasPagarDto: UpdateContasPagarDto): Promise<ContasPagar> {
    const contasPagarExistente = await this.prisma.contasPagar.findUnique({
      where: { publicId },
    });

    if (!contasPagarExistente) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    // Verificar se o parceiro existe (se fornecido)
    if (updateContasPagarDto.parceiroId) {
      const parceiro = await this.prisma.parceiro.findUnique({
        where: { id: updateContasPagarDto.parceiroId },
      });

      if (!parceiro) {
        throw new BadRequestException('Parceiro não encontrado');
      }
    }

    const contasPagar = await this.prisma.contasPagar.update({
      where: { publicId },
      data: {
        ...updateContasPagarDto,
        dataVencimento: updateContasPagarDto.dataVencimento ? new Date(updateContasPagarDto.dataVencimento) : undefined,
        dataPagamento: updateContasPagarDto.dataPagamento ? new Date(updateContasPagarDto.dataPagamento) : undefined,
      },
      include: {
        Parceiro: true,
        ContasPagarParcelas: true,
      },
    });

    return new ContasPagar({
      ...contasPagar,
      valorTotal: Number(contasPagar.valorTotal),
      saldo: Number(contasPagar.saldo),
      cotacao: Number(contasPagar.cotacao),
      parceiro: contasPagar.Parceiro,
      contasPagarParcelas: contasPagar.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
        cotacao: Number(parcela.cotacao),
      })),
    });
  }

  async remove(publicId: string): Promise<void> {
    const contasPagar = await this.prisma.contasPagar.findUnique({
      where: { publicId },
    });

    if (!contasPagar) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    await this.prisma.contasPagar.delete({
      where: { publicId },
    });
  }

  async findByParceiro(parceiroId: number): Promise<ContasPagar[]> {
    const contasPagar = await this.prisma.contasPagar.findMany({
      where: { parceiroId },
      include: {
        Parceiro: true,
        ContasPagarParcelas: true,
      },
      orderBy: { dataVencimento: 'desc' },
    });

    return contasPagar.map(conta => new ContasPagar({
      ...conta,
      valorTotal: Number(conta.valorTotal),
      saldo: Number(conta.saldo),
      cotacao: Number(conta.cotacao),
      parceiro: conta.Parceiro,
      contasPagarParcelas: conta.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
        cotacao: Number(parcela.cotacao),
      })),
    }));
  }

  async findByOrigemTipo(origemTipo: string): Promise<ContasPagar[]> {
    const contasPagar = await this.prisma.contasPagar.findMany({
      where: { origemTipo },
      include: {
        Parceiro: true,
        ContasPagarParcelas: true,
      },
      orderBy: { dataVencimento: 'desc' },
    });

    return contasPagar.map(conta => new ContasPagar({
      ...conta,
      valorTotal: Number(conta.valorTotal),
      saldo: Number(conta.saldo),
      cotacao: Number(conta.cotacao),
      parceiro: conta.Parceiro,
      contasPagarParcelas: conta.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
        cotacao: Number(parcela.cotacao),
      })),
    }));
  }

  async findByStatus(pago: boolean): Promise<ContasPagar[]> {
    const contasPagar = await this.prisma.contasPagar.findMany({
      where: { pago },
      include: {
        Parceiro: true,
        ContasPagarParcelas: true,
      },
      orderBy: { dataVencimento: 'desc' },
    });

    return contasPagar.map(conta => new ContasPagar({
      ...conta,
      valorTotal: Number(conta.valorTotal),
      saldo: Number(conta.saldo),
      cotacao: Number(conta.cotacao),
      parceiro: conta.Parceiro,
      contasPagarParcelas: conta.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
        cotacao: Number(parcela.cotacao),
      })),
    }));
  }
}