import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateParcelamentoDto } from './dto/create-parcelamento.dto';
import { UpdateParcelamentoDto } from './dto/update-parcelamento.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Parcelamento } from './entities/parcelamento.entity';

@Injectable()
export class ParcelamentoService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(p: any): Parcelamento {
    return {
      id: p.id,
      idPagamento: p.idPagamento,
      clienteId: p.clienteId,
      valorTotal: p.valorTotal,
      valorPago: p.valorPago,
      idFormaPag: p.idFormaPag,
      situacao: p.situacao,
      formaPagamentoNome: p.FormaPagamento?.nome,
      clienteNome: p.cliente?.nome,
    };
  }

  async create(dto: CreateParcelamentoDto): Promise<Parcelamento> {
    if (!dto?.idPagamento || !dto?.clienteId || !dto?.idFormaPag || dto?.valorTotal === undefined) {
      throw new BadRequestException('idPagamento, clienteId, idFormaPag e valorTotal são obrigatórios');
    }

    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const forma = await this.prisma.formaPagamento.findFirst({ where: { idFormaPag: dto.idFormaPag } });
    if (!forma) throw new NotFoundException('Forma de pagamento não encontrada');

    const pagamento = await this.prisma.pagamento.findUnique({ where: { id: dto.idPagamento } });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');

    const created = await this.prisma.parcelamento.create({
      data: {
        idPagamento: dto.idPagamento,
        clienteId: dto.clienteId,
        valorTotal: dto.valorTotal,
        valorPago: dto.valorPago ?? 0,
        idFormaPag: dto.idFormaPag,
        situacao: dto.situacao ?? 1,
      },
      include: { FormaPagamento: true, cliente: true },
    });
    return this.mapToEntity(created);
  }

  async findAll(pagamentoId: number): Promise<Parcelamento[]> {
    if (!pagamentoId) throw new BadRequestException('pagamentoId é obrigatório');
    const pagamento = await this.prisma.pagamento.findUnique({ where: { id: pagamentoId } });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');

    const items = await this.prisma.parcelamento.findMany({
      where: { idPagamento: pagamentoId },
      include: { FormaPagamento: true, cliente: true },
      orderBy: { id: 'asc' },
    });
    return items.map(this.mapToEntity.bind(this));
  }

  async findOne(id: number): Promise<Parcelamento> {
    const item = await this.prisma.parcelamento.findUnique({
      where: { id },
      include: { FormaPagamento: true, cliente: true },
    });
    if (!item) throw new NotFoundException('Parcelamento não encontrado');
    return this.mapToEntity(item);
  }

  async update(id: number, dto: UpdateParcelamentoDto): Promise<Parcelamento> {
    const existing = await this.prisma.parcelamento.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parcelamento não encontrado');

    if (dto.clienteId && dto.clienteId !== existing.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
      if (!cliente) throw new NotFoundException('Novo cliente não encontrado');
    }

    if (dto.idFormaPag && dto.idFormaPag !== existing.idFormaPag) {
      const forma = await this.prisma.formaPagamento.findFirst({ where: { idFormaPag: dto.idFormaPag } });
      if (!forma) throw new NotFoundException('Nova forma de pagamento não encontrada');
    }

    if (dto.idPagamento && dto.idPagamento !== existing.idPagamento) {
      const pagamento = await this.prisma.pagamento.findUnique({ where: { id: dto.idPagamento } });
      if (!pagamento) throw new NotFoundException('Novo pagamento não encontrado');
    }

    const updated = await this.prisma.parcelamento.update({
      where: { id },
      data: {
        idPagamento: dto.idPagamento ?? existing.idPagamento,
        clienteId: dto.clienteId ?? existing.clienteId,
        valorTotal: dto.valorTotal ?? existing.valorTotal,
        valorPago: dto.valorPago ?? existing.valorPago,
        idFormaPag: dto.idFormaPag ?? existing.idFormaPag,
        situacao: dto.situacao ?? existing.situacao,
      },
      include: { FormaPagamento: true, cliente: true },
    });
    return this.mapToEntity(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.parcelamento.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parcelamento não encontrado');
    await this.prisma.parcelamento.delete({ where: { id } });
  }
}
