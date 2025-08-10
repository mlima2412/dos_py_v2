import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContasPagarParcelasDto } from './dto/create-contas-pagar-parcelas.dto';
import { UpdateContasPagarParcelasDto } from './dto/update-contas-pagar-parcelas.dto';
import { ContasPagarParcelas } from './entities/contas-pagar-parcelas.entity';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class ContasPagarParcelasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContasPagarParcelasDto: CreateContasPagarParcelasDto): Promise<ContasPagarParcelas> {
    // Verificar se a conta a pagar existe
    const contasPagar = await this.prisma.contasPagar.findUnique({
      where: { id: createContasPagarParcelasDto.contasPagarId },
    });

    if (!contasPagar) {
      throw new BadRequestException('Conta a pagar não encontrada');
    }

    const parcela = await this.prisma.contasPagarParcelas.create({
      data: {
        publicId: uuidv7(),
        dataPagamento: new Date(createContasPagarParcelasDto.dataPagamento),
        valor: createContasPagarParcelasDto.valor,
        currencyId: createContasPagarParcelasDto.currencyId,
        cotacao: createContasPagarParcelasDto.cotacao || 0,
        contasPagarId: createContasPagarParcelasDto.contasPagarId,
      },
      include: {
        contasPagar: {
          include: {
            Parceiro: true,
          },
        },
      },
    });

    // Atualizar o saldo da conta a pagar
    await this.updateContasPagarSaldo(createContasPagarParcelasDto.contasPagarId);

    return new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      cotacao: Number(parcela.cotacao),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
        cotacao: Number(parcela.contasPagar.cotacao),
      } : undefined,
    });
  }

  async findAll(): Promise<ContasPagarParcelas[]> {
    const parcelas = await this.prisma.contasPagarParcelas.findMany({
      include: {
        contasPagar: {
          include: {
            Parceiro: true,
          },
        },
      },
      orderBy: { dataPagamento: 'desc' },
    });

    return parcelas.map(parcela => new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      cotacao: Number(parcela.cotacao),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
        cotacao: Number(parcela.contasPagar.cotacao),
      } : undefined,
    }));
  }

  async findOne(publicId: string): Promise<ContasPagarParcelas> {
    const parcela = await this.prisma.contasPagarParcelas.findUnique({
      where: { publicId },
      include: {
        contasPagar: {
          include: {
            Parceiro: true,
          },
        },
      },
    });

    if (!parcela) {
      throw new NotFoundException('Parcela não encontrada');
    }

    return new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      cotacao: Number(parcela.cotacao),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
        cotacao: Number(parcela.contasPagar.cotacao),
      } : undefined,
    });
  }

  async update(publicId: string, updateContasPagarParcelasDto: UpdateContasPagarParcelasDto): Promise<ContasPagarParcelas> {
    const parcelaExistente = await this.prisma.contasPagarParcelas.findUnique({
      where: { publicId },
    });

    if (!parcelaExistente) {
      throw new NotFoundException('Parcela não encontrada');
    }

    // Verificar se a conta a pagar existe (se fornecida)
    if (updateContasPagarParcelasDto.contasPagarId) {
      const contasPagar = await this.prisma.contasPagar.findUnique({
        where: { id: updateContasPagarParcelasDto.contasPagarId },
      });

      if (!contasPagar) {
        throw new BadRequestException('Conta a pagar não encontrada');
      }
    }

    const parcela = await this.prisma.contasPagarParcelas.update({
      where: { publicId },
      data: {
        ...updateContasPagarParcelasDto,
        dataPagamento: updateContasPagarParcelasDto.dataPagamento ? new Date(updateContasPagarParcelasDto.dataPagamento) : undefined,
      },
      include: {
        contasPagar: {
          include: {
            Parceiro: true,
          },
        },
      },
    });

    // Atualizar o saldo da conta a pagar
    await this.updateContasPagarSaldo(parcela.contasPagarId);

    return new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      cotacao: Number(parcela.cotacao),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
        cotacao: Number(parcela.contasPagar.cotacao),
      } : undefined,
    });
  }

  async remove(publicId: string): Promise<void> {
    const parcela = await this.prisma.contasPagarParcelas.findUnique({
      where: { publicId },
    });

    if (!parcela) {
      throw new NotFoundException('Parcela não encontrada');
    }

    const contasPagarId = parcela.contasPagarId;

    await this.prisma.contasPagarParcelas.delete({
      where: { publicId },
    });

    // Atualizar o saldo da conta a pagar
    await this.updateContasPagarSaldo(contasPagarId);
  }

  async findByContasPagar(contasPagarId: number): Promise<ContasPagarParcelas[]> {
    const parcelas = await this.prisma.contasPagarParcelas.findMany({
      where: { contasPagarId },
      include: {
        contasPagar: {
          include: {
            Parceiro: true,
          },
        },
      },
      orderBy: { dataPagamento: 'desc' },
    });

    return parcelas.map(parcela => new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      cotacao: Number(parcela.cotacao),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
        cotacao: Number(parcela.contasPagar.cotacao),
      } : undefined,
    }));
  }

  private async updateContasPagarSaldo(contasPagarId: number): Promise<void> {
    // Calcular o saldo total das parcelas pagas
    const result = await this.prisma.contasPagarParcelas.aggregate({
      where: { contasPagarId },
      _sum: {
        valor: true,
      },
    });

    const saldoTotal = result._sum.valor || 0;

    // Atualizar o saldo na conta a pagar
    await this.prisma.contasPagar.update({
      where: { id: contasPagarId },
      data: {
        saldo: saldoTotal,
        // Verificar se a conta está totalmente paga
        pago: await this.isContaTotalmentePaga(contasPagarId, Number(saldoTotal)),
      },
    });
  }

  private async isContaTotalmentePaga(contasPagarId: number, saldo: number): Promise<boolean> {
    const contasPagar = await this.prisma.contasPagar.findUnique({
      where: { id: contasPagarId },
      select: { valorTotal: true },
    });

    if (!contasPagar) {
      return false;
    }

    return Number(contasPagar.valorTotal) <= saldo;
  }
}