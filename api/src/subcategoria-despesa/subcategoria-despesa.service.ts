import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCategoriaDespesaDto } from './dto/create-subcategoria-despesa.dto';
import { UpdateSubCategoriaDespesaDto } from './dto/update-subcategoria-despesa.dto';
import { SubCategoriaDespesa } from './entities/subcategoria-despesa.entity';

@Injectable()
export class SubCategoriaDespesaService {
  constructor(private prisma: PrismaService) {}

  async create(createSubCategoriaDespesaDto: CreateSubCategoriaDespesaDto): Promise<SubCategoriaDespesa> {
    // Verificar se a categoria existe
    const categoria = await this.prisma.categoriaDespesas.findUnique({
      where: { idCategoria: createSubCategoriaDespesaDto.categoriaId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria de despesas não encontrada');
    }

    // Verificar se a descrição já existe na mesma categoria
    const existingItem = await this.prisma.subCategoriaDespesa.findFirst({
      where: {
        idSubCategoria: createSubCategoriaDespesaDto.idSubCategoria,
        descricao: createSubCategoriaDespesaDto.descricao,
        categoriaId: createSubCategoriaDespesaDto.categoriaId,
      },
    });

    if (existingItem) {
      throw new ConflictException('Descrição da subcategoria já existe nesta categoria');
    }

    // Criar instância da entidade SubCategoriaDespesa
    const itemEntity = SubCategoriaDespesa.create({
      idSubCategoria: createSubCategoriaDespesaDto.idSubCategoria,
      categoriaId: createSubCategoriaDespesaDto.categoriaId,
      descricao: createSubCategoriaDespesaDto.descricao,
      ativo: createSubCategoriaDespesaDto.ativo,
    });

    const item = await this.prisma.subCategoriaDespesa.create({
      data: {
        idSubCategoria: itemEntity.idSubCategoria,
        categoriaId: itemEntity.categoriaId,
        descricao: itemEntity.descricao,
        ativo: itemEntity.ativo,
      },
      include: {
        categoria: true,
      },
    });

    return item;
  }

  async findAll(): Promise<SubCategoriaDespesa[]> {
    return this.prisma.subCategoriaDespesa.findMany({
      where: { ativo: true },
      include: {
        categoria: true,
      },
      orderBy: { descricao: 'asc' },
    });
  }

  async findByCategoria(categoriaId: number): Promise<SubCategoriaDespesa[]> {
    return this.prisma.subCategoriaDespesa.findMany({
      where: {
        categoriaId,
        ativo: true,
      },
      include: {
        categoria: true,
      },
      orderBy: { descricao: 'asc' },
    });
  }

  async findOne(idSubCategoria: number): Promise<SubCategoriaDespesa> {
    const item = await this.prisma.subCategoriaDespesa.findUnique({
      where: { idSubCategoria },
      include: {
        categoria: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Subcategoria de despesas não encontrada');
    }

    return item;
  }

  async update(idSubCategoria: number, updateSubCategoriaDespesaDto: UpdateSubCategoriaDespesaDto): Promise<SubCategoriaDespesa> {
    // Verificar se a subcategoria existe
    await this.findOne(idSubCategoria);

    // Verificar se a nova categoria existe (se fornecida)
    if (updateSubCategoriaDespesaDto.categoriaId) {
      const categoria = await this.prisma.categoriaDespesas.findUnique({
        where: { idCategoria: updateSubCategoriaDespesaDto.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException('Categoria de despesas não encontrada');
      }
    }

    // Verificar se a nova descrição já existe na categoria (se fornecida)
    if (updateSubCategoriaDespesaDto.descricao || updateSubCategoriaDespesaDto.categoriaId) {
      const currentItem = await this.prisma.subCategoriaDespesa.findUnique({
        where: { idSubCategoria },
      });

      const descricao = updateSubCategoriaDespesaDto.descricao || currentItem.descricao;
      const categoriaId = updateSubCategoriaDespesaDto.categoriaId || currentItem.categoriaId;

      const existingItem = await this.prisma.subCategoriaDespesa.findFirst({
        where: {
          descricao,
          categoriaId,
          idSubCategoria: { not: idSubCategoria },
        },
      });

      if (existingItem) {
        throw new ConflictException('Descrição da subcategoria já existe nesta categoria');
      }
    }

    return this.prisma.subCategoriaDespesa.update({
      where: { idSubCategoria },
      data: updateSubCategoriaDespesaDto,
      include: {
        categoria: true,
      },
    });
  }

  async remove(idSubCategoria: number): Promise<void> {
    // Verificar se a subcategoria existe
    await this.findOne(idSubCategoria);

    // Soft delete - marcar como inativo
    await this.prisma.subCategoriaDespesa.update({
      where: { idSubCategoria },
      data: { ativo: false },
    });
  }
}