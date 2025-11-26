import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateParcelamentoDto } from './dto/create-parcelamento.dto';
import { UpdateParcelamentoDto } from './dto/update-parcelamento.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Parcelamento } from './entities/parcelamento.entity';
import { ParcelamentoComVendaDto } from './dto/parcelamento-com-venda.dto';
import { ParcelaDto } from './dto/parcela.dto';

@Injectable()
export class ParcelamentoService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(p: any): Parcelamento {
    return {
      id: p.id,
      vendaId: p.vendaId,
      vendaPublicId: p.vendas?.[0]?.publicId,
      clienteId: p.clienteId,
      valorTotal: p.valorTotal,
      valorPago: p.valorPago,
      situacao: p.situacao,
      clienteNome: p.cliente?.nome,
    };
  }

  async create(dto: CreateParcelamentoDto): Promise<Parcelamento> {
    if (!dto?.vendaId || !dto?.clienteId || dto?.valorTotal === undefined) {
      throw new BadRequestException(
        'vendaId, clienteId e valorTotal são obrigatórios',
      );
    }

    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const created = await this.prisma.parcelamento.create({
      data: {
        vendaId: dto.vendaId,
        clienteId: dto.clienteId,
        valorTotal: dto.valorTotal,
        valorPago: dto.valorPago ?? 0,
        situacao: dto.situacao ?? 1,
      },
    });
    return this.mapToEntity(created);
  }

  async findOne(id: number): Promise<Parcelamento> {
    const item = await this.prisma.parcelamento.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        vendas: {
          select: {
            publicId: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Parcelamento não encontrado');
    return this.mapToEntity(item);
  }

  async update(id: number, dto: UpdateParcelamentoDto): Promise<Parcelamento> {
    const existing = await this.prisma.parcelamento.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Parcelamento não encontrado');

    if (dto.clienteId && dto.clienteId !== existing.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: dto.clienteId },
      });
      if (!cliente) throw new NotFoundException('Novo cliente não encontrado');
    }

    const updated = await this.prisma.parcelamento.update({
      where: { id },
      data: {
        vendaId: dto.vendaId ?? existing.vendaId,
        clienteId: dto.clienteId ?? existing.clienteId,
        valorTotal: dto.valorTotal ?? existing.valorTotal,
        valorPago: dto.valorPago ?? existing.valorPago,
        situacao: dto.situacao ?? existing.situacao,
      },
    });
    return this.mapToEntity(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.parcelamento.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Parcelamento não encontrado');
    await this.prisma.parcelamento.delete({ where: { id } });
  }

  async findAllByParceiro(
    parceiroId: number,
  ): Promise<ParcelamentoComVendaDto[]> {
    if (!parceiroId) {
      throw new BadRequestException('parceiroId é obrigatório');
    }

    // Primeiro, buscar todas as vendas do parceiro
    const vendas = await this.prisma.venda.findMany({
      where: { parceiroId },
      select: { id: true },
    });

    const vendaIds = vendas.map(v => v.id);

    if (vendaIds.length === 0) {
      return [];
    }

    // Buscar todos os parcelamentos relacionados às vendas do parceiro
    const parcelamentos = await this.prisma.parcelamento.findMany({
      where: {
        vendaId: {
          in: vendaIds,
        },
      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        vendaId: 'desc',
      },
    });

    // Buscar as vendas correspondentes para pegar a dataVenda
    const vendasDetalhes = await this.prisma.venda.findMany({
      where: {
        id: {
          in: parcelamentos.map(p => p.vendaId),
        },
      },
      select: {
        id: true,
        dataVenda: true,
      },
    });

    const vendasMap = new Map(vendasDetalhes.map(v => [v.id, v.dataVenda]));

    // Mapear para o DTO de resposta
    return parcelamentos.map(p => ({
      id: p.id,
      vendaId: p.vendaId,
      clienteId: p.clienteId,
      clienteNome: p.cliente.nome,
      dataVenda: vendasMap.get(p.vendaId) || null,
      valorTotal: p.valorTotal,
      valorPago: p.valorPago,
      situacao: p.situacao,
      situacaoDescricao: p.situacao === 1 ? 'Aberto' : 'Concluído',
    }));
  }

  async findByCliente(
    clienteId: number,
    parceiroId: number,
  ): Promise<ParcelamentoComVendaDto[]> {
    if (!clienteId) {
      throw new BadRequestException('clienteId é obrigatório');
    }

    // Verificar se o cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se o cliente pertence ao parceiro
    if (cliente.parceiroId !== parceiroId) {
      throw new ForbiddenException(
        'Cliente não pertence ao parceiro informado',
      );
    }

    // Buscar parcelamentos do cliente com dados da venda
    const parcelamentos = await this.prisma.parcelamento.findMany({
      where: {
        clienteId,
      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        vendas: {
          where: {
            parceiroId,
          },
          select: {
            id: true,
            dataVenda: true,
          },
        },
      },
      orderBy: {
        vendaId: 'desc',
      },
    });

    // Mapear para o DTO de resposta
    return parcelamentos.map(p => ({
      id: p.id,
      vendaId: p.vendaId,
      clienteId: p.clienteId,
      clienteNome: p.cliente.nome,
      dataVenda: p.vendas[0]?.dataVenda || null,
      valorTotal: p.valorTotal,
      valorPago: p.valorPago,
      situacao: p.situacao,
      situacaoDescricao: p.situacao === 1 ? 'Aberto' : 'Concluído',
    }));
  }

  async findParcelasByParcelamento(
    parcelamentoId: number,
    parceiroId: number,
  ): Promise<ParcelaDto[]> {
    if (!parcelamentoId) {
      throw new BadRequestException('parcelamentoId é obrigatório');
    }

    // Buscar o parcelamento e validar se pertence ao parceiro
    const parcelamento = await this.prisma.parcelamento.findUnique({
      where: { id: parcelamentoId },
      include: {
        vendas: {
          where: {
            parceiroId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!parcelamento) {
      throw new NotFoundException('Parcelamento não encontrado');
    }

    // Validar se a venda pertence ao parceiro
    if (!parcelamento.vendas || parcelamento.vendas.length === 0) {
      throw new ForbiddenException(
        'Parcelamento não pertence ao parceiro informado',
      );
    }

    // Buscar as parcelas
    const parcelas = await this.prisma.parcelas.findMany({
      where: {
        parcelamentoId,
      },
      orderBy: {
        numero: 'asc',
      },
    });

    // Mapear para o DTO
    return parcelas.map(p => ({
      id: p.id,
      parcelamentoId: p.parcelamentoId,
      numero: p.numero,
      valor: Number(p.valor),
      vencimento: p.vencimento,
      recebidoEm: p.recebidoEm,
      status: p.status,
    }));
  }

  async marcarParcelaPaga(
    parcelaId: number,
    parceiroId: number,
    dataPagamento?: string,
  ): Promise<ParcelaDto> {
    if (!parcelaId) {
      throw new BadRequestException('parcelaId é obrigatório');
    }

    // Buscar a parcela e validar se pertence ao parceiro
    const parcela = await this.prisma.parcelas.findUnique({
      where: { id: parcelaId },
      include: {
        Parcelamento: {
          include: {
            vendas: {
              where: {
                parceiroId,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!parcela) {
      throw new NotFoundException('Parcela não encontrada');
    }

    if (
      !parcela.Parcelamento?.vendas ||
      parcela.Parcelamento.vendas.length === 0
    ) {
      throw new ForbiddenException(
        'Parcela não pertence ao parceiro informado',
      );
    }

    if (parcela.status === 'PAGO' || parcela.status === 'PAGO_ATRASADO') {
      throw new BadRequestException('Parcela já está paga');
    }

    const dataRecebimento = dataPagamento
      ? new Date(dataPagamento)
      : new Date();
    const vencimento = parcela.vencimento;
    const atrasada = vencimento && dataRecebimento > vencimento;

    // Atualizar status da parcela
    const parcelaAtualizada = await this.prisma.parcelas.update({
      where: { id: parcelaId },
      data: {
        status: atrasada ? 'PAGO_ATRASADO' : 'PAGO',
        recebidoEm: dataRecebimento,
      },
    });

    // Atualizar valor pago no parcelamento
    await this.prisma.parcelamento.update({
      where: { id: parcela.parcelamentoId },
      data: {
        valorPago: {
          increment: Number(parcela.valor),
        },
      },
    });

    // Verificar se todas as parcelas foram pagas para atualizar situação
    const parcelasRestantes = await this.prisma.parcelas.count({
      where: {
        parcelamentoId: parcela.parcelamentoId,
        status: 'PENDENTE',
      },
    });

    if (parcelasRestantes === 0) {
      await this.prisma.parcelamento.update({
        where: { id: parcela.parcelamentoId },
        data: {
          situacao: 2, // Concluído
        },
      });
    }

    return {
      id: parcelaAtualizada.id,
      parcelamentoId: parcelaAtualizada.parcelamentoId,
      numero: parcelaAtualizada.numero,
      valor: Number(parcelaAtualizada.valor),
      vencimento: parcelaAtualizada.vencimento,
      recebidoEm: parcelaAtualizada.recebidoEm,
      status: parcelaAtualizada.status,
    };
  }

  async criarParcelaEspontanea(
    parcelamentoId: number,
    parceiroId: number,
    valor: number,
    dataPagamento?: string,
  ): Promise<ParcelaDto> {
    if (!parcelamentoId) {
      throw new BadRequestException('parcelamentoId é obrigatório');
    }

    if (!valor || valor <= 0) {
      throw new BadRequestException('Valor deve ser maior que zero');
    }

    // Buscar o parcelamento e validar se pertence ao parceiro
    const parcelamento = await this.prisma.parcelamento.findUnique({
      where: { id: parcelamentoId },
      include: {
        vendas: {
          where: {
            parceiroId,
          },
          select: {
            id: true,
          },
        },
        parcelas: {
          orderBy: {
            numero: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!parcelamento) {
      throw new NotFoundException('Parcelamento não encontrado');
    }

    if (!parcelamento.vendas || parcelamento.vendas.length === 0) {
      throw new ForbiddenException(
        'Parcelamento não pertence ao parceiro informado',
      );
    }

    // Validar se o valor não ultrapassa o saldo restante
    const saldoRestante = parcelamento.valorTotal - parcelamento.valorPago;
    if (valor > saldoRestante) {
      throw new BadRequestException(
        `Valor (${valor}) não pode ser maior que o saldo restante (${saldoRestante})`,
      );
    }

    // Obter o próximo número de parcela
    const ultimaParcela = parcelamento.parcelas[0];
    const proximoNumero = ultimaParcela ? ultimaParcela.numero + 1 : 1;

    const dataRecebimento = dataPagamento
      ? new Date(dataPagamento)
      : new Date();

    // Criar a nova parcela já paga
    const novaParcela = await this.prisma.parcelas.create({
      data: {
        parcelamentoId,
        numero: proximoNumero,
        valor,
        vencimento: null, // Parcelamento flexível não tem vencimento
        recebidoEm: dataRecebimento,
        status: 'PAGO',
      },
    });

    // Atualizar valor pago no parcelamento
    await this.prisma.parcelamento.update({
      where: { id: parcelamentoId },
      data: {
        valorPago: {
          increment: valor,
        },
      },
    });

    // Verificar se o parcelamento foi totalmente pago
    const novoValorPago = parcelamento.valorPago + valor;
    if (novoValorPago >= parcelamento.valorTotal) {
      await this.prisma.parcelamento.update({
        where: { id: parcelamentoId },
        data: {
          situacao: 2, // Concluído
        },
      });
    }

    return {
      id: novaParcela.id,
      parcelamentoId: novaParcela.parcelamentoId,
      numero: novaParcela.numero,
      valor: Number(novaParcela.valor),
      vencimento: novaParcela.vencimento,
      recebidoEm: novaParcela.recebidoEm,
      status: novaParcela.status,
    };
  }
}
