import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContasPagarDto } from './dto/create-contas-pagar.dto';
import { UpdateContasPagarDto } from './dto/update-contas-pagar.dto';
import { ContasPagar } from './entities/contas-pagar.entity';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class ContasPagarService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createContasPagarDto: CreateContasPagarDto,
  ): Promise<ContasPagar> {
    const contasPagar = await this.prisma.contasPagar.create({
      data: {
        publicId: uuidv7(),
        despesaId: createContasPagarDto.despesaId,
        dataCriacao: new Date(),
        valorTotal: createContasPagarDto.valorTotal,
        saldo: createContasPagarDto.saldo || 0,
        pago: createContasPagarDto.pago || false,
      },
      include: {
        ContasPagarParcelas: true,
      },
    });

    return new ContasPagar({
      ...contasPagar,
      valorTotal: Number(contasPagar.valorTotal),
      saldo: Number(contasPagar.saldo),
      contasPagarParcelas: contasPagar.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
      })),
    });
  }

  async findAll(): Promise<ContasPagar[]> {
    console.log('Entrou aqui');
    const contasPagar = await this.prisma.contasPagar.findMany({
      include: {
        ContasPagarParcelas: true,
      },
      orderBy: { dataCriacao: 'desc' },
    });
    console.log(contasPagar);

    return contasPagar.map(
      conta =>
        new ContasPagar({
          ...conta,
          valorTotal: Number(conta.valorTotal),
          saldo: Number(conta.saldo),
          contasPagarParcelas: conta.ContasPagarParcelas.map(parcela => ({
            ...parcela,
            valor: Number(parcela.valor),
          })),
        }),
    );
  }

  async findOne(publicId: string): Promise<ContasPagar> {
    const contasPagar = await this.prisma.contasPagar.findUnique({
      where: { publicId },
      include: {
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
      contasPagarParcelas: contasPagar.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
      })),
    });
  }

  async update(
    publicId: string,
    updateContasPagarDto: UpdateContasPagarDto,
  ): Promise<ContasPagar> {
    const existingConta = await this.prisma.contasPagar.findUnique({
      where: { publicId },
    });

    if (!existingConta) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }
    const contasPagar = await this.prisma.contasPagar.update({
      where: { publicId },
      data: {
        valorTotal: updateContasPagarDto.valorTotal,
        saldo: updateContasPagarDto.saldo,
        pago: updateContasPagarDto.pago,
        dataPagamento: updateContasPagarDto.dataPagamento
          ? new Date(updateContasPagarDto.dataPagamento)
          : undefined,
      },
      include: {
        ContasPagarParcelas: true,
      },
    });

    return new ContasPagar({
      ...contasPagar,
      valorTotal: Number(contasPagar.valorTotal),
      saldo: Number(contasPagar.saldo),
      contasPagarParcelas: contasPagar.ContasPagarParcelas.map(parcela => ({
        ...parcela,
        valor: Number(parcela.valor),
      })),
    });
  }

  async remove(publicId: string): Promise<void> {
    const existingConta = await this.prisma.contasPagar.findUnique({
      where: { publicId },
    });

    if (!existingConta) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    await this.prisma.contasPagar.delete({
      where: { publicId },
    });
  }

  async findByDespesa(despesaId: number): Promise<ContasPagar[]> {
    const contasPagar = await this.prisma.contasPagar.findMany({
      where: { despesaId },
      include: {
        ContasPagarParcelas: true,
      },
      orderBy: { dataCriacao: 'desc' },
    });

    return contasPagar.map(
      conta =>
        new ContasPagar({
          ...conta,
          valorTotal: Number(conta.valorTotal),
          saldo: Number(conta.saldo),
          contasPagarParcelas: conta.ContasPagarParcelas.map(parcela => ({
            ...parcela,
            valor: Number(parcela.valor),
          })),
        }),
    );
  }

  async findByStatus(pago: boolean): Promise<ContasPagar[]> {
    const contasPagar = await this.prisma.contasPagar.findMany({
      where: { pago },
      include: {
        ContasPagarParcelas: true,
      },
      orderBy: { dataCriacao: 'desc' },
    });

    return contasPagar.map(
      conta =>
        new ContasPagar({
          ...conta,
          valorTotal: Number(conta.valorTotal),
          saldo: Number(conta.saldo),
          contasPagarParcelas: conta.ContasPagarParcelas.map(parcela => ({
            ...parcela,
            valor: Number(parcela.valor),
          })),
        }),
    );
  }
}
