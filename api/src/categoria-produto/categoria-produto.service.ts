import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaProdutoDto } from './dto/create-categoria-produto.dto';
import { UpdateCategoriaProdutoDto } from './dto/update-categoria-produto.dto';
import { CategoriaProduto } from './entities/categoria-produto.entity';

@Injectable()
export class CategoriaProdutoService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoriaProdutoDto: CreateCategoriaProdutoDto): Promise<CategoriaProduto> {
    // Verificar se a descrição já existe
    const existingCategoria = await this.prisma.categoriaProduto.findFirst({
      where: { descricao: createCategoriaProdutoDto.descricao },
    });

    if (existingCategoria) {
      throw new ConflictException('Categoria com esta descrição já existe');
    }

    // Criar instância da entidade CategoriaProduto
    const categoriaEntity = CategoriaProduto.create({
      descricao: createCategoriaProdutoDto.descricao,
    });

    const categoria = await this.prisma.categoriaProduto.create({
      data: {
        descricao: categoriaEntity.descricao,
      },
    });

    return categoria;
  }

  async findAll(): Promise<CategoriaProduto[]> {
    const categorias = await this.prisma.categoriaProduto.findMany({
      orderBy: {
        descricao: 'asc',
      },
    });

    return categorias;
  }

  async findOne(id: number): Promise<CategoriaProduto> {
    const categoria = await this.prisma.categoriaProduto.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria de produto não encontrada');
    }

    return categoria;
  }

  async update(
    id: number,
    updateCategoriaProdutoDto: UpdateCategoriaProdutoDto,
  ): Promise<CategoriaProduto> {
    // Verificar se a categoria existe
    await this.findOne(id);

    // Se está atualizando a descrição, verificar se já existe
    if (updateCategoriaProdutoDto.descricao) {
      const existingCategoria = await this.prisma.categoriaProduto.findFirst({
        where: {
          descricao: updateCategoriaProdutoDto.descricao,
          NOT: { id },
        },
      });

      if (existingCategoria) {
        throw new ConflictException('Categoria com esta descrição já existe');
      }
    }

    const categoria = await this.prisma.categoriaProduto.update({
      where: { id },
      data: updateCategoriaProdutoDto,
    });

    return categoria;
  }

  async remove(id: number): Promise<void> {
    // Verificar se a categoria existe
    await this.findOne(id);

    // Verificar se a categoria está sendo usada por produtos
    const produtosCount = await this.prisma.produto.count({
      where: { categoriaId: id },
    });

    if (produtosCount > 0) {
      throw new ConflictException(
        'Não é possível remover categoria que está sendo usada por produtos',
      );
    }

    await this.prisma.categoriaProduto.delete({
      where: { id },
    });
  }
}
