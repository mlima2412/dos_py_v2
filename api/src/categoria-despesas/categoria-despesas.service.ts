import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDespesasDto } from './dto/create-categoria-despesas.dto';
import { UpdateCategoriaDespesasDto } from './dto/update-categoria-despesas.dto';
import { CategoriaDespesas } from './entities/categoria-despesas.entity';

@Injectable()
export class CategoriaDespesasService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoriaDespesasDto: CreateCategoriaDespesasDto): Promise<CategoriaDespesas> {
    // Verificar se a descrição já existe
    const existingCategoria = await this.prisma.categoriaDespesas.findFirst({
      where: { descricao: createCategoriaDespesasDto.descricao },
    });

    if (existingCategoria) {
      throw new ConflictException('Descrição da categoria já está em uso');
    }

    // Criar instância da entidade CategoriaDespesas
    const categoriaEntity = CategoriaDespesas.create({
      descricao: createCategoriaDespesasDto.descricao,
      ativo: createCategoriaDespesasDto.ativo,
    });

    const categoria = await this.prisma.categoriaDespesas.create({
      data: {
        descricao: categoriaEntity.descricao,
        ativo: categoriaEntity.ativo,
      },
    });

    return categoria;
  }

  async findAll(): Promise<CategoriaDespesas[]> {
    return this.prisma.categoriaDespesas.findMany({
      where: { ativo: true },
      orderBy: { descricao: 'asc' },
    });
  }

  async findOne(idCategoria: number): Promise<CategoriaDespesas> {
    const categoria = await this.prisma.categoriaDespesas.findUnique({
      where: { idCategoria },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria de despesas não encontrada');
    }

    return categoria;
  }

  async update(idCategoria: number, updateCategoriaDespesasDto: UpdateCategoriaDespesasDto): Promise<CategoriaDespesas> {
    // Verificar se a categoria existe
    await this.findOne(idCategoria);

    // Verificar se a nova descrição já existe em outra categoria
    if (updateCategoriaDespesasDto.descricao) {
      const existingCategoria = await this.prisma.categoriaDespesas.findFirst({
        where: {
          descricao: updateCategoriaDespesasDto.descricao,
          idCategoria: { not: idCategoria },
        },
      });

      if (existingCategoria) {
        throw new ConflictException('Descrição da categoria já está em uso');
      }
    }

    return this.prisma.categoriaDespesas.update({
      where: { idCategoria },
      data: updateCategoriaDespesasDto,
    });
  }

  async remove(idCategoria: number): Promise<void> {
    // Verificar se a categoria existe
    await this.findOne(idCategoria);

    // Soft delete - marcar como inativo
    await this.prisma.categoriaDespesas.update({
      where: { idCategoria },
      data: { ativo: false },
    });
  }
}