import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImpostoDto } from './dto/create-imposto.dto';
import { UpdateImpostoDto } from './dto/update-imposto.dto';
import { Imposto } from './entities/imposto.entity';
import { uuidv7 } from 'uuidv7';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ImpostoService {
  constructor(private prisma: PrismaService) {}

  async create(
    createImpostoDto: CreateImpostoDto,
    parceiroId: number,
  ): Promise<Imposto> {
    // Verificar se já existe um imposto com a mesma sigla para este parceiro
    const existingImposto = await this.prisma.imposto.findFirst({
      where: {
        parceiroId,
        sigla: createImpostoDto.sigla,
      },
    });

    if (existingImposto) {
      throw new ConflictException(
        'Já existe um imposto com esta sigla para este parceiro',
      );
    }

    const imposto = await this.prisma.imposto.create({
      data: {
        publicId: uuidv7(),
        parceiroId,
        nome: createImpostoDto.nome,
        sigla: createImpostoDto.sigla,
        percentual: new Decimal(createImpostoDto.percentual),
        ativo: createImpostoDto.ativo ?? true,
      },
    });

    return imposto;
  }

  async findAll(parceiroId: number): Promise<Imposto[]> {
    return this.prisma.imposto.findMany({
      where: { parceiroId, ativo: true },
      orderBy: { sigla: 'asc' },
    });
  }

  async findOne(id: number, parceiroId: number): Promise<Imposto> {
    const imposto = await this.prisma.imposto.findFirst({
      where: { id, parceiroId },
    });

    if (!imposto) {
      throw new NotFoundException('Imposto não encontrado');
    }

    return imposto;
  }

  async findByPublicId(publicId: string, parceiroId: number): Promise<Imposto> {
    const imposto = await this.prisma.imposto.findFirst({
      where: { publicId, parceiroId },
    });

    if (!imposto) {
      throw new NotFoundException('Imposto não encontrado');
    }

    return imposto;
  }

  async findBySigla(sigla: string, parceiroId: number): Promise<Imposto> {
    const imposto = await this.prisma.imposto.findFirst({
      where: { sigla, parceiroId },
    });

    if (!imposto) {
      throw new NotFoundException('Imposto não encontrado');
    }

    return imposto;
  }

  async update(
    id: number,
    updateImpostoDto: UpdateImpostoDto,
    parceiroId: number,
  ): Promise<Imposto> {
    // Verificar se o imposto existe
    await this.findOne(id, parceiroId);

    // Verificar se a nova sigla já existe em outro imposto
    if (updateImpostoDto.sigla) {
      const existingImposto = await this.prisma.imposto.findFirst({
        where: {
          parceiroId,
          sigla: updateImpostoDto.sigla,
          id: { not: id },
        },
      });

      if (existingImposto) {
        throw new ConflictException(
          'Já existe um imposto com esta sigla para este parceiro',
        );
      }
    }

    const data: any = { ...updateImpostoDto };
    if (updateImpostoDto.percentual !== undefined) {
      data.percentual = new Decimal(updateImpostoDto.percentual);
    }

    return this.prisma.imposto.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, parceiroId: number): Promise<void> {
    // Verificar se o imposto existe
    await this.findOne(id, parceiroId);

    // Soft delete - marcar como inativo
    await this.prisma.imposto.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
