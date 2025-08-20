import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContasPagarParcelasDto } from './dto/create-contas-pagar-parcelas.dto';
import { UpdateContasPagarParcelasDto } from './dto/update-contas-pagar-parcelas.dto';
import { ContasPagarParcelas } from './entities/contas-pagar-parcelas.entity';
import { Currency } from '../currency/entities/currency.entity';
import { DespesaCacheService } from '../despesa-cache/despesa-cache.service';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class ContasPagarParcelasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly despesaCacheService: DespesaCacheService
  ) {}

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
        dataVencimento: new Date(createContasPagarParcelasDto.dataVencimento),
        valor: createContasPagarParcelasDto.valor,
        pago: createContasPagarParcelasDto.pago || false,
        contasPagarId: createContasPagarParcelasDto.contasPagarId,
        currencyId:createContasPagarParcelasDto.currencyId
      },
      include: {
        contasPagar: true,
      },
    });

    // Atualizar o saldo da conta a pagar
    await this.updateContasPagarSaldo(createContasPagarParcelasDto.contasPagarId);

    return new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
      } : undefined,
    });
  }

  async findAll(): Promise<ContasPagarParcelas[]> {
    // preciso criar uma clausula where e filtrar o parceiroId
    const parcelas = await this.prisma.contasPagarParcelas.findMany({
      include: {
        contasPagar: {
          include: {
            despesa: {
              include: {
                subCategoria: true,
              },
            },
          },
        },
        currency: true,
      },
      orderBy: { dataVencimento: 'asc' },
    });

    return parcelas.map(parcela => new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      currency: parcela.currency ? new Currency({
        ...parcela.currency,
        defaultRate: Number(parcela.currency.defaultRate),
      }) : undefined,
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
        despesa: parcela.contasPagar.despesa ? {
          ...parcela.contasPagar.despesa,
          valorTotal: Number(parcela.contasPagar.despesa.valorTotal),
          cotacao: parcela.contasPagar.despesa.cotacao ? Number(parcela.contasPagar.despesa.cotacao) : null,
          subCategoria: parcela.contasPagar.despesa.subCategoria,
        } : undefined,
      } : undefined,
    }));
  }

  async findAllAgenda(parceiroId: number): Promise<ContasPagarParcelas[]> {
    // preciso criar uma clausula where e filtrar o parceiroId
    const parcelas = await this.prisma.contasPagarParcelas.findMany({
      where: {
        contasPagar: {
          despesa: {
            parceiroId,
          },
        },
      },
      include: {
        contasPagar: {
          include: {
            despesa: {
              include: {
                subCategoria: true,
              },
            },
          },
        },
        currency: true,
      },
      orderBy: { dataVencimento: 'asc' },
    });

    return parcelas.map(parcela => new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      currency: parcela.currency ? new Currency({
        ...parcela.currency,
        defaultRate: Number(parcela.currency.defaultRate),
      }) : undefined,
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
        despesa: parcela.contasPagar.despesa ? {
          ...parcela.contasPagar.despesa,
          valorTotal: Number(parcela.contasPagar.despesa.valorTotal),
          cotacao: parcela.contasPagar.despesa.cotacao ? Number(parcela.contasPagar.despesa.cotacao) : null,
          subCategoria: parcela.contasPagar.despesa.subCategoria,
        } : undefined,
      } : undefined,
    }));
  }

  async findOne(publicId: string): Promise<ContasPagarParcelas> {
    const parcela = await this.prisma.contasPagarParcelas.findUnique({
      where: { publicId },
      include: {
        contasPagar: true,
      },
    });

    if (!parcela) {
      throw new NotFoundException('Parcela não encontrada');
    }

    return new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
      } : undefined,
    });
  }

  async update(publicId: string, updateContasPagarParcelasDto: UpdateContasPagarParcelasDto): Promise<ContasPagarParcelas> {
    const existingParcela = await this.prisma.contasPagarParcelas.findUnique({
      where: { publicId },
      include: {
        contasPagar: true,
      },
    });

    if (!existingParcela) {
      throw new NotFoundException('Parcela não encontrada');
    }

    // Verificar se houve mudança no status de pagamento
    const statusChanged = existingParcela.pago !== updateContasPagarParcelasDto.pago;
    const wasUnpaidNowPaid = !existingParcela.pago && updateContasPagarParcelasDto.pago === true;
    const wasPaidNowUnpaid = existingParcela.pago && updateContasPagarParcelasDto.pago === false;

    const parcela = await this.prisma.contasPagarParcelas.update({
      where: { publicId },
      data: {
        dataPagamento: updateContasPagarParcelasDto.dataPagamento ? new Date(updateContasPagarParcelasDto.dataPagamento) : undefined,
        dataVencimento: updateContasPagarParcelasDto.dataVencimento ? new Date(updateContasPagarParcelasDto.dataVencimento) : undefined,
        valor: updateContasPagarParcelasDto.valor,
        pago: updateContasPagarParcelasDto.pago,
      },
      include: {
        contasPagar: true,
      },
    });

    // TODO: Implementar atualização do cache quando necessário

    // Atualizar o saldo da conta a pagar
    await this.updateContasPagarSaldo(existingParcela.contasPagarId);

    return new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
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

    await this.prisma.contasPagarParcelas.delete({
      where: { publicId },
    });

    // Atualizar o saldo da conta a pagar
    await this.updateContasPagarSaldo(parcela.contasPagarId);
  }

  async findByContasPagar(contasPagarId: number): Promise<ContasPagarParcelas[]> {
    const parcelas = await this.prisma.contasPagarParcelas.findMany({
      where: { contasPagarId },
      include: {
        contasPagar: true,
      },
      orderBy: { dataPagamento: 'desc' },
    });

    return parcelas.map(parcela => new ContasPagarParcelas({
      ...parcela,
      valor: Number(parcela.valor),
      contasPagar: parcela.contasPagar ? {
        ...parcela.contasPagar,
        valorTotal: Number(parcela.contasPagar.valorTotal),
        saldo: Number(parcela.contasPagar.saldo),
      } : undefined,
    }));
  }

  private async updateContasPagarSaldo(contasPagarId: number): Promise<void> {
    // Calcular o saldo total das parcelas pagas
    const result = await this.prisma.contasPagarParcelas.aggregate({
      where: { contasPagarId, pago: true },
      _sum: {
        valor: true,
      },
    });

    const saldoTotal = result._sum.valor || 0;

    // Atualizar o saldo e status da conta a pagar
    const contasPagar = await this.prisma.contasPagar.findUnique({
      where: { id: contasPagarId },
    });

    if (contasPagar) {
      const isPago = await this.isContaTotalmentePaga(contasPagarId, Number(saldoTotal));
      
      await this.prisma.contasPagar.update({
        where: { id: contasPagarId },
        data: {
          saldo: saldoTotal,
          pago: isPago,
        },
      });
    }
  }

  private async isContaTotalmentePaga(contasPagarId: number, saldo: number): Promise<boolean> {
    const contasPagar = await this.prisma.contasPagar.findUnique({
      where: { id: contasPagarId },
    });

    if (!contasPagar) {
      return false;
    }

    return Number(contasPagar.valorTotal) <= saldo;
  }
}