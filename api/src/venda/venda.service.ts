import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { uuidv7 } from 'uuidv7';
import { VendaStatus, VendaTipo } from '@prisma/client';
import { Venda } from './entities/venda.entity';

@Injectable()
export class VendaService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToVendaEntity(data: any): Venda {
    const venda = new Venda({
      id: data.id,
      publicId: data.publicId,
      usuarioId: data.usuarioId,
      parceiroId: data.parceiroId,
      localSaidaId: data.localSaidaId,
      clienteId: data.clienteId,
      tipo: data.tipo,
      status: data.status,
      dataVenda: data.dataVenda,
      dataEntrega: data.dataEntrega,
      valorFrete: data.valorFrete != null ? Number(data.valorFrete) : null,
      desconto: data.desconto != null ? Number(data.desconto) : null,
      ruccnpj: data.ruccnpj,
      numeroFatura: data.numeroFatura,
      observacao: data.observacao,
      valorComissao:
        data.valorComissao != null ? Number(data.valorComissao) : null,
      clienteNome: data.Cliente?.nome,
      clienteSobrenome: data.Cliente?.sobrenome,
      usuarioNome: data.Usuario?.nome,
      VendaItem: data.VendaItem
        ? data.VendaItem.map((vi: any) => ({
            id: vi.id,
            vendaId: vi.vendaId,
            skuId: vi.skuId,
            tipo: vi.tipo,
            qtdReservada: vi.qtdReservada,
            qtdAceita: vi.qtdAceita,
            qtdDevolvida: vi.qtdDevolvida,
            desconto: vi.desconto != null ? Number(vi.desconto) : null,
            precoUnit: Number(vi.precoUnit),
            skuPublicId: vi.ProdutoSKU?.publicId,
            skuCor: vi.ProdutoSKU?.cor ?? null,
            skuCodCor: vi.ProdutoSKU?.codCor ?? null,
            skuTamanho: vi.ProdutoSKU?.tamanho ?? null,
            produtoId: vi.ProdutoSKU?.produto?.id,
            produtoPublicId: vi.ProdutoSKU?.produto?.publicId,
            produtoNome: vi.ProdutoSKU?.produto?.nome,
            produtoPrecoVenda:
              vi.ProdutoSKU?.produto?.precoVenda != null
                ? Number(vi.ProdutoSKU.produto.precoVenda)
                : undefined,
          }))
        : undefined,
    });
    return venda;
  }

  async create(
    createVendaDto: CreateVendaDto,
    usuarioId: number,
    parceiroId: number,
  ): Promise<Venda> {
    // Validações simples de integridade
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createVendaDto.clienteId },
      select: { id: true, parceiroId: true },
    });
    if (!cliente) {
      throw new BadRequestException('Cliente inválido');
    }
    if (cliente.parceiroId !== parceiroId) {
      throw new ForbiddenException(
        'Cliente não pertence ao parceiro informado',
      );
    }

    const localSaida = await this.prisma.localEstoque.findUnique({
      where: { id: createVendaDto.localSaidaId },
      select: { id: true, parceiroId: true },
    });
    if (!localSaida) {
      throw new BadRequestException('Local de saída inválido');
    }
    if (localSaida.parceiroId !== parceiroId) {
      throw new ForbiddenException(
        'Local de saída não pertence ao parceiro informado',
      );
    }

    const created = await this.prisma.venda.create({
      data: {
        publicId: uuidv7(),
        usuarioId,
        parceiroId,
        localSaidaId: createVendaDto.localSaidaId,
        clienteId: createVendaDto.clienteId,
        tipo: createVendaDto.tipo ?? VendaTipo.DIRETA,
        status: VendaStatus.PEDIDO,
        dataEntrega: createVendaDto.dataEntrega
          ? new Date(createVendaDto.dataEntrega)
          : undefined,
        valorFrete:
          createVendaDto.valorFrete != null
            ? new Decimal(createVendaDto.valorFrete)
            : undefined,
        desconto:
          createVendaDto.desconto != null
            ? new Decimal(createVendaDto.desconto)
            : undefined,
        ruccnpj: createVendaDto.ruccnpj,
        numeroFatura: createVendaDto.numeroFatura,
        observacao: createVendaDto.observacao,
        valorComissao:
          createVendaDto.valorComissao != null
            ? new Decimal(createVendaDto.valorComissao)
            : undefined,
      },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
      },
    });
    return this.mapToVendaEntity(created);
  }

  async findAll(parceiroId: number): Promise<Venda[]> {
    const vendas = await this.prisma.venda.findMany({
      where: { parceiroId },
      orderBy: { dataVenda: 'desc' },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
        Cliente: { select: { id: true, nome: true, sobrenome: true } },
        Usuario: { select: { id: true, nome: true } },
        VendaItem: {
          select: {
            id: true,
            vendaId: true,
            skuId: true,
            tipo: true,
            qtdReservada: true,
            qtdAceita: true,
            qtdDevolvida: true,
            desconto: true,
            precoUnit: true,
            ProdutoSKU: {
              select: {
                id: true,
                publicId: true,
                tamanho: true,
                cor: true,
                codCor: true,
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                    precoVenda: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return vendas.map(v => this.mapToVendaEntity(v));
  }

  async paginate(
    parceiroId: number,
    page: number,
    limit: number,
    status?: VendaStatus,
  ): Promise<{ data: Venda[]; total: number; page: number; limit: number }> {
    const where: any = { parceiroId };
    if (status) {
      where.status = status;
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.venda.count({ where }),
      this.prisma.venda.findMany({
        where,
        orderBy: { dataVenda: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          publicId: true,
          usuarioId: true,
          parceiroId: true,
          localSaidaId: true,
          clienteId: true,
          tipo: true,
          status: true,
          dataVenda: true,
          dataEntrega: true,
          valorFrete: true,
          desconto: true,
          ruccnpj: true,
          numeroFatura: true,
          observacao: true,
          valorComissao: true,
          Cliente: { select: { id: true, nome: true, sobrenome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            select: {
              id: true,
              vendaId: true,
              skuId: true,
              tipo: true,
              qtdReservada: true,
              qtdAceita: true,
              qtdDevolvida: true,
              desconto: true,
              precoUnit: true,
            },
          },
        },
      }),
    ]);

    return {
      data: data.map(d => this.mapToVendaEntity(d)),
      total,
      page,
      limit,
    };
  }

  async findOne(publicId: string, parceiroId: number): Promise<Venda> {
    const venda = await this.prisma.venda.findFirst({
      where: { publicId, parceiroId },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
        Cliente: { select: { id: true, nome: true, sobrenome: true } },
        Usuario: { select: { id: true, nome: true } },
        // Evitar incluir outras relações na busca principal
        VendaItem: {
          select: {
            id: true,
            vendaId: true,
            skuId: true,
            tipo: true,
            qtdReservada: true,
            qtdAceita: true,
            qtdDevolvida: true,
            desconto: true,
            precoUnit: true,
            ProdutoSKU: {
              select: {
                id: true,
                publicId: true,
                tamanho: true,
                cor: true,
                codCor: true,
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                    precoVenda: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!venda) {
      throw new NotFoundException('Venda não encontrada');
    }
    return this.mapToVendaEntity(venda);
  }

  async update(
    publicId: string,
    updateVendaDto: UpdateVendaDto,
    parceiroId: number,
  ): Promise<Venda> {
    const existing = await this.prisma.venda.findFirst({
      where: { publicId, parceiroId },
    });
    if (!existing) {
      throw new NotFoundException('Venda não encontrada');
    }

    const updated = await this.prisma.venda.update({
      where: { id: existing.id },
      data: {
        tipo: updateVendaDto.tipo ?? undefined,
        dataEntrega: updateVendaDto.dataEntrega
          ? new Date(updateVendaDto.dataEntrega)
          : undefined,
        valorFrete:
          updateVendaDto.valorFrete != null
            ? new Decimal(updateVendaDto.valorFrete)
            : undefined,
        desconto:
          updateVendaDto.desconto != null
            ? new Decimal(updateVendaDto.desconto)
            : undefined,
        ruccnpj: updateVendaDto.ruccnpj ?? undefined,
        numeroFatura: updateVendaDto.numeroFatura ?? undefined,
        observacao: updateVendaDto.observacao ?? undefined,
        valorComissao:
          updateVendaDto.valorComissao != null
            ? new Decimal(updateVendaDto.valorComissao)
            : undefined,
      },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
      },
    });
    return this.mapToVendaEntity(updated);
  }

  async remove(publicId: string, parceiroId: number): Promise<void> {
    const venda = await this.prisma.venda.findFirst({
      where: { publicId, parceiroId },
      select: { id: true, status: true },
    });
    if (!venda) {
      throw new NotFoundException('Venda não encontrada');
    }
    if (venda.status !== VendaStatus.PEDIDO) {
      throw new BadRequestException(
        'Exclusão permitida apenas quando status da venda for PEDIDO',
      );
    }
    await this.prisma.venda.delete({ where: { id: venda.id } });
  }
}
