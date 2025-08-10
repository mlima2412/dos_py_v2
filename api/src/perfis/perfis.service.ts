import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { Perfil } from './entities/perfil.entity';

@Injectable()
export class PerfisService {
  constructor(private prisma: PrismaService) {}

  async create(createPerfilDto: CreatePerfilDto): Promise<Perfil> {
    // Verificar se o nome já existe
    const existingPerfil = await this.prisma.perfil.findFirst({
      where: { nome: createPerfilDto.nome },
    });

    if (existingPerfil) {
      throw new ConflictException('Nome do perfil já está em uso');
    }

    // Criar instância da entidade Perfil
    const perfilEntity = Perfil.create({
      nome: createPerfilDto.nome,
      ativo: createPerfilDto.ativo,
    });

    const perfil = await this.prisma.perfil.create({
      data: {
        nome: perfilEntity.nome,
        ativo: perfilEntity.ativo,
      },
    });

    return perfil;
  }

  async findAll(): Promise<Perfil[]> {
    return this.prisma.perfil.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number): Promise<Perfil> {
    const perfil = await this.prisma.perfil.findUnique({
      where: { id },
    });

    if (!perfil) {
      throw new NotFoundException(`Perfil com ID ${id} não encontrado`);
    }

    return perfil;
  }

  async update(id: number, updatePerfilDto: UpdatePerfilDto): Promise<Perfil> {
    const existingPerfil = await this.findOne(id);

    // Verificar se o novo nome já existe (se foi alterado)
    if (updatePerfilDto.nome && updatePerfilDto.nome !== existingPerfil.nome) {
      const perfilWithSameName = await this.prisma.perfil.findFirst({
        where: {
          nome: updatePerfilDto.nome,
          id: { not: id },
        },
      });

      if (perfilWithSameName) {
        throw new ConflictException('Nome do perfil já está em uso');
      }
    }

    const perfil = await this.prisma.perfil.update({
      where: { id },
      data: updatePerfilDto,
    });

    return perfil;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    // Soft delete - apenas marca como inativo
    await this.prisma.perfil.update({
      where: { id },
      data: { ativo: false },
    });
  }
}