import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateParcelaDto } from './dto/create-parcela.dto';
import { UpdateParcelaDto } from './dto/update-parcela.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Parcela } from './entities/parcela.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class ParcelasService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(p: any): Parcela {
    return {
      id: p.id,
      parcelamentoId: p.parcelamentoId,
      numero: p.numero,
      valor: Number(p.valor),
      vencimento: p.vencimento,
      recebidoEm: p.recebidoEm,
      status: p.status,
    };
  }

  async create(dto: CreateParcelaDto): Promise<Parcela> {
    if (!dto?.parcelamentoId || !dto?.numero || dto?.valor === undefined) {
      throw new BadRequestException('parcelamentoId, numero e valor são obrigatórios');
    }

    const parcelamento = await this.prisma.parcelamento.findUnique({ where: { id: dto.parcelamentoId } });
    if (!parcelamento) throw new NotFoundException('Parcelamento não encontrado');

    const created = await this.prisma.parcelas.create({
      data: {
        parcelamentoId: dto.parcelamentoId,
        numero: dto.numero,
        valor: new Prisma.Decimal(dto.valor),
        vencimento: dto.vencimento ? new Date(dto.vencimento) : null,
        recebidoEm: dto.recebidoEm ? new Date(dto.recebidoEm) : null,
        status: dto.status,
      },
    });
    return this.mapToEntity(created);
  }

  async findAll(parcelamentoId: number): Promise<Parcela[]> {
    if (!parcelamentoId) throw new BadRequestException('parcelamentoId é obrigatório');
    const parcelamento = await this.prisma.parcelamento.findUnique({ where: { id: parcelamentoId } });
    if (!parcelamento) throw new NotFoundException('Parcelamento não encontrado');

    const items = await this.prisma.parcelas.findMany({
      where: { parcelamentoId },
      orderBy: { numero: 'asc' },
    });
    return items.map(this.mapToEntity.bind(this));
  }

  async findOne(id: number): Promise<Parcela> {
    const item = await this.prisma.parcelas.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Parcela não encontrada');
    return this.mapToEntity(item);
  }

  async update(id: number, dto: UpdateParcelaDto): Promise<Parcela> {
    const existing = await this.prisma.parcelas.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parcela não encontrada');

    if (dto.parcelamentoId && dto.parcelamentoId !== existing.parcelamentoId) {
      const parcelamento = await this.prisma.parcelamento.findUnique({ where: { id: dto.parcelamentoId } });
      if (!parcelamento) throw new NotFoundException('Novo parcelamento não encontrado');
    }

    const updated = await this.prisma.parcelas.update({
      where: { id },
      data: {
        parcelamentoId: dto.parcelamentoId ?? existing.parcelamentoId,
        numero: dto.numero ?? existing.numero,
        valor: dto.valor !== undefined ? new Prisma.Decimal(dto.valor) : existing.valor,
        vencimento: dto.vencimento ? new Date(dto.vencimento) : existing.vencimento,
        recebidoEm: dto.recebidoEm ? new Date(dto.recebidoEm) : existing.recebidoEm,
        status: dto.status ?? existing.status,
      },
    });
    return this.mapToEntity(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.parcelas.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parcela não encontrada');
    await this.prisma.parcelas.delete({ where: { id } });
  }
}
