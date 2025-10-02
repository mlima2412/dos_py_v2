import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocalEstoqueDto } from './dto/create-local-estoque.dto';
import { UpdateLocalEstoqueDto } from './dto/update-local-estoque.dto';
import { LocalEstoque } from './entities/local-estoque.entity';
import { EtiquetaPedidoCompraDto } from 'src/pedido-compra/dto/etiquetas-pedido-compra';

@Injectable()
export class LocalEstoqueService {
  constructor(private prisma: PrismaService) {}

  async create(
    createLocalEstoqueDto: CreateLocalEstoqueDto,
  ): Promise<LocalEstoque> {
    // Verificar se já existe local com mesmo nome no parceiro
    const existingLocal = await this.prisma.localEstoque.findFirst({
      where: {
        nome: createLocalEstoqueDto.nome,
        parceiroId: createLocalEstoqueDto.parceiroId,
      },
    });

    if (existingLocal) {
      throw new ConflictException(
        'Já existe um local de estoque com este nome para este parceiro',
      );
    }

    // Criar instância da entidade
    const localEstoqueEntity = LocalEstoque.create({
      ...createLocalEstoqueDto,
    });

    const localEstoque = await this.prisma.localEstoque.create({
      data: {
        publicId: localEstoqueEntity.publicId,
        parceiroId: localEstoqueEntity.parceiroId,
        nome: localEstoqueEntity.nome,
        descricao: localEstoqueEntity.descricao,
        endereco: localEstoqueEntity.endereco,
      },
    });

    return this.mapToLocalEstoqueEntity(localEstoque);
  }

  async findAll(): Promise<LocalEstoque[]> {
    const locaisEstoque = await this.prisma.localEstoque.findMany({
      orderBy: { id: 'asc' },
    });

    return locaisEstoque.map(local => this.mapToLocalEstoqueEntity(local));
  }

  async findByParceiro(parceiroId: number): Promise<LocalEstoque[]> {
    const locaisEstoque = await this.prisma.localEstoque.findMany({
      where: { parceiroId },
      orderBy: { id: 'asc' },
    });

    return locaisEstoque.map(local => this.mapToLocalEstoqueEntity(local));
  }

  async findOne(publicId: string): Promise<LocalEstoque> {
    const localEstoque = await this.prisma.localEstoque.findFirst({
      where: { publicId },
    });

    if (!localEstoque) {
      throw new NotFoundException('Local de estoque não encontrado');
    }

    return this.mapToLocalEstoqueEntity(localEstoque);
  }

  async update(
    publicId: string,
    updateLocalEstoqueDto: UpdateLocalEstoqueDto,
  ): Promise<LocalEstoque> {
    // Verificar se o local existe
    const existingLocal = await this.prisma.localEstoque.findFirst({
      where: { publicId },
    });

    if (!existingLocal) {
      throw new NotFoundException('Local de estoque não encontrado');
    }

    // Verificar nome único se está sendo alterado
    if (
      updateLocalEstoqueDto.nome &&
      updateLocalEstoqueDto.nome !== existingLocal.nome
    ) {
      const localWithSameName = await this.prisma.localEstoque.findFirst({
        where: {
          nome: updateLocalEstoqueDto.nome,
          parceiroId: existingLocal.parceiroId,
          id: { not: existingLocal.id },
        },
      });

      if (localWithSameName) {
        throw new ConflictException(
          'Já existe um local de estoque com este nome para este parceiro',
        );
      }
    }

    const localEstoque = await this.prisma.localEstoque.update({
      where: { id: existingLocal.id },
      data: updateLocalEstoqueDto,
    });

    return this.mapToLocalEstoqueEntity(localEstoque);
  }

  async remove(publicId: string): Promise<void> {
    const existingLocal = await this.prisma.localEstoque.findFirst({
      where: { publicId },
    });

    if (!existingLocal) {
      throw new NotFoundException('Local de estoque não encontrado');
    }

    // Verificar se há estoque vinculado a este local
    const estoqueVinculado = await this.prisma.estoqueSKU.findFirst({
      where: { localId: existingLocal.id },
    });

    if (estoqueVinculado) {
      throw new ConflictException(
        'Não é possível excluir local de estoque que possui produtos em estoque',
      );
    }

    await this.prisma.localEstoque.delete({
      where: { id: existingLocal.id },
    });
  }

  private mapToLocalEstoqueEntity(data: any): LocalEstoque {
    return {
      id: data.id,
      publicId: data.publicId,
      parceiroId: data.parceiroId,
      nome: data.nome,
      descricao: data.descricao,
      endereco: data.endereco,
    } as LocalEstoque;
  }

  async imprimeEtiquetasLocalEstoque(
    publicId: string,
    parceiroId: number,
  ): Promise<EtiquetaPedidoCompraDto[]> {
    // Acha o pedido de compra pelo publicid
    const localEstoque = await this.prisma.localEstoque.findFirst({
      where: {
        publicId,
        parceiroId,
      },
    });
    if (!localEstoque) {
      throw new NotFoundException('Local de estoque não encontrado');
    }

    const result = await this.prisma.$queryRaw<
      {
        produto_id: number;
        sku_id: number;
        nome: string;
        cor: string;
        tamanho: string;
        preco: number;
        qtd: number;
      }[]
    >`
    WITH repetidos as (
      select p.id as produto_id, psku.id as sku_id, p.nome, psku.cor, psku.tamanho, estoque.qtd, p."preco_venda" as preco, generate_series(1, estoque.qtd) as repeticao
        FROM public."estoque_sku" as estoque 
        JOIN public."produto_sku" as psku on estoque."sku_id" = psku.id
        join public."produto" as p on p.id = psku."produto_id"
        where estoque."local_id" = ${localEstoque.id}
    )
    select produto_id, sku_id, nome, cor, tamanho, preco, 1 as qtd
      from repetidos
      order by nome asc, cor desc
    `;

    return result.map(item => ({
      id_produto: item.produto_id,
      id_sku: item.sku_id,
      nome: item.nome,
      cor: item.cor,
      tamanho: item.tamanho,
      preco: item.preco,
    }));
  }
}
