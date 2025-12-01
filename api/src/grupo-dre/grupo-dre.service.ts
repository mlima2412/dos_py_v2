import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoDreDto } from './dto/create-grupo-dre.dto';
import { UpdateGrupoDreDto } from './dto/update-grupo-dre.dto';
import { GrupoDRE } from './entities/grupo-dre.entity';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class GrupoDreService {
  constructor(private prisma: PrismaService) {}

  async create(createGrupoDreDto: CreateGrupoDreDto): Promise<GrupoDRE> {
    // Verificar se o código já existe
    const existingGrupo = await this.prisma.grupoDRE.findFirst({
      where: { codigo: createGrupoDreDto.codigo },
    });

    if (existingGrupo) {
      throw new ConflictException('Código do grupo DRE já está em uso');
    }

    const grupo = await this.prisma.grupoDRE.create({
      data: {
        publicId: uuidv7(),
        codigo: createGrupoDreDto.codigo,
        nome: createGrupoDreDto.nome,
        tipo: createGrupoDreDto.tipo,
        ordem: createGrupoDreDto.ordem,
        ativo: createGrupoDreDto.ativo ?? true,
      },
    });

    return grupo;
  }

  async findAll(): Promise<GrupoDRE[]> {
    return this.prisma.grupoDRE.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    });
  }

  async findOne(id: number): Promise<GrupoDRE> {
    const grupo = await this.prisma.grupoDRE.findUnique({
      where: { id },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo DRE não encontrado');
    }

    return grupo;
  }

  async findByPublicId(publicId: string): Promise<GrupoDRE> {
    const grupo = await this.prisma.grupoDRE.findUnique({
      where: { publicId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo DRE não encontrado');
    }

    return grupo;
  }

  async findByCodigo(codigo: string): Promise<GrupoDRE> {
    const grupo = await this.prisma.grupoDRE.findUnique({
      where: { codigo },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo DRE não encontrado');
    }

    return grupo;
  }

  async update(
    id: number,
    updateGrupoDreDto: UpdateGrupoDreDto,
  ): Promise<GrupoDRE> {
    // Verificar se o grupo existe
    await this.findOne(id);

    // Verificar se o novo código já existe em outro grupo
    if (updateGrupoDreDto.codigo) {
      const existingGrupo = await this.prisma.grupoDRE.findFirst({
        where: {
          codigo: updateGrupoDreDto.codigo,
          id: { not: id },
        },
      });

      if (existingGrupo) {
        throw new ConflictException('Código do grupo DRE já está em uso');
      }
    }

    return this.prisma.grupoDRE.update({
      where: { id },
      data: updateGrupoDreDto,
    });
  }

  async remove(id: number): Promise<void> {
    // Verificar se o grupo existe
    await this.findOne(id);

    // Soft delete - marcar como inativo
    await this.prisma.grupoDRE.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
