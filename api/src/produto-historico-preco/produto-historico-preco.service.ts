import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoHistoricoPrecoDto } from './dto/create-produto-historico-preco.dto';
import { ProdutoHistoricoPreco } from './entities/produto-historico-preco.entity';
import { ProdutoHistoricoPrecoResponseDto } from './dto/produto-historico-preco-response.dto';
import { HistoricoPrecoQueryDto } from './dto/historico-preco-query.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProdutoHistoricoPrecoService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProdutoHistoricoPrecoDto: CreateProdutoHistoricoPrecoDto,
    parceiroId: number,
  ): Promise<ProdutoHistoricoPreco> {
    // Verificar se o produto existe e pertence ao parceiro
    await this.validateProdutoExists(
      createProdutoHistoricoPrecoDto.produtoId,
      parceiroId,
    );

    // Criar entidade
    const historicoEntity = ProdutoHistoricoPreco.create(
      createProdutoHistoricoPrecoDto,
    );

    const historico = await this.prisma.produtoHistoricoPreco.create({
      data: {
        produtoId: historicoEntity.produtoId,
        preco: new Decimal(historicoEntity.preco),
        data: historicoEntity.data,
      },
      include: {
        Produto: true,
      },
    });

    return this.mapToProdutoHistoricoPrecoEntity(historico);
  }

  async findAll(
    parceiroId: number,
    query?: HistoricoPrecoQueryDto,
  ): Promise<ProdutoHistoricoPrecoResponseDto[]> {
    const where: any = {
      Produto: {
        parceiroId,
      },
    };

    // Aplicar filtros de data se fornecidos
    if (query?.dataInicial || query?.dataFinal) {
      where.data = {};
      if (query.dataInicial) {
        where.data.gte = new Date(query.dataInicial);
      }
      if (query.dataFinal) {
        where.data.lte = new Date(query.dataFinal);
      }
    }

    const historicos = await this.prisma.produtoHistoricoPreco.findMany({
      where,
      include: {
        Produto: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        data: 'desc',
      },
      take: query?.limit || 100,
    });

    return historicos.map(historico => ({
      id: historico.id,
      produtoId: historico.produtoId,
      preco: Number(historico.preco),
      data: historico.data,
      nomeProduto: historico.Produto?.nome,
    }));
  }

  async findOne(
    id: number,
    parceiroId: number,
  ): Promise<ProdutoHistoricoPreco> {
    const historico = await this.prisma.produtoHistoricoPreco.findFirst({
      where: {
        id,
        Produto: {
          parceiroId,
        },
      },
      include: {
        Produto: true,
      },
    });

    if (!historico) {
      throw new NotFoundException('Histórico de preço não encontrado');
    }

    return this.mapToProdutoHistoricoPrecoEntity(historico);
  }

  async findByProdutoId(
    produtoId: number,
    parceiroId: number,
    query?: HistoricoPrecoQueryDto,
  ): Promise<ProdutoHistoricoPrecoResponseDto[]> {
    // Verificar se o produto existe e pertence ao parceiro
    await this.validateProdutoExists(produtoId, parceiroId);

    const where: any = {
      produtoId,
      Produto: {
        parceiroId,
      },
    };

    // Aplicar filtros de data se fornecidos
    if (query?.dataInicial || query?.dataFinal) {
      where.data = {};
      if (query.dataInicial) {
        where.data.gte = new Date(query.dataInicial);
      }
      if (query.dataFinal) {
        where.data.lte = new Date(query.dataFinal);
      }
    }

    const historicos = await this.prisma.produtoHistoricoPreco.findMany({
      where,
      include: {
        Produto: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        data: 'desc',
      },
      take: query?.limit || 100,
    });

    return historicos.map(historico => ({
      id: historico.id,
      produtoId: historico.produtoId,
      preco: Number(historico.preco),
      data: historico.data,
      nomeProduto: historico.Produto?.nome,
    }));
  }

  async findByProdutoPublicId(
    produtoPublicId: string,
    parceiroId: number,
    query?: HistoricoPrecoQueryDto,
  ): Promise<ProdutoHistoricoPrecoResponseDto[]> {
    // Buscar o produto pelo publicId
    const produto = await this.prisma.produto.findFirst({
      where: {
        publicId: produtoPublicId,
        parceiroId,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.findByProdutoId(produto.id, parceiroId, query);
  }

  async getLatestPriceByProdutoId(
    produtoId: number,
    parceiroId: number,
  ): Promise<ProdutoHistoricoPrecoResponseDto | null> {
    // Verificar se o produto existe e pertence ao parceiro
    await this.validateProdutoExists(produtoId, parceiroId);

    const historico = await this.prisma.produtoHistoricoPreco.findFirst({
      where: {
        produtoId,
        Produto: {
          parceiroId,
        },
      },
      include: {
        Produto: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        data: 'desc',
      },
    });

    if (!historico) {
      return null;
    }

    return {
      id: historico.id,
      produtoId: historico.produtoId,
      preco: Number(historico.preco),
      data: historico.data,
      nomeProduto: historico.Produto?.nome,
    };
  }

  private async validateProdutoExists(
    produtoId: number,
    parceiroId: number,
  ): Promise<void> {
    const produto = await this.prisma.produto.findFirst({
      where: {
        id: produtoId,
        parceiroId,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }
  }

  private mapToProdutoHistoricoPrecoEntity(data: any): ProdutoHistoricoPreco {
    return new ProdutoHistoricoPreco({
      id: data.id,
      produtoId: data.produtoId,
      preco: Number(data.preco),
      data: data.data,
      Produto: data.Produto,
    });
  }
}
