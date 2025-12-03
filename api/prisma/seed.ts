import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';

import { Client } from 'pg';
import { DespesasService } from '../src/despesas/despesas.service';
import { CategoriaDespesasService } from '../src/categoria-despesas/categoria-despesas.service';
import { SubCategoriaDespesaService } from '../src/subcategoria-despesa/subcategoria-despesa.service';
import { ClientesService } from '../src/clientes/clientes.service';
import { ProdutoService } from '../src/produto/produto.service';
import { ProdutoSkuService } from '../src/produto-sku/produto-sku.service';
import { EstoqueSkuService } from '../src/estoque-sku/estoque-sku.service';
import { FornecedoresService } from '../src/fornecedores/fornecedores.service';
import { PedidoCompraService } from '../src/pedido-compra/pedido-compra.service';
import { PedidoCompraItemService } from '../src/pedido-compra-item/pedido-compra-item.service';
import { PrismaService } from '../src/prisma/prisma.service';

import {
  CreateDespesaDto,
  TipoPagamento as TipoPagamentoEnum,
} from '../src/despesas/dto/create-despesa.dto';
import { CreateCategoriaDespesasDto } from '../src/categoria-despesas/dto/create-categoria-despesas.dto';
import { CreateSubCategoriaDespesaDto } from '../src/subcategoria-despesa/dto/create-subcategoria-despesa.dto';
import { CreateClienteDto } from '../src/clientes/dto/create-cliente.dto';
import { CreateProdutoDto } from '../src/produto/dto/create-produto.dto';
import { CreateProdutoSkuDto } from '../src/produto-sku/dto/create-produto-sku.dto';
import { CreateEstoqueSkuDto } from '../src/estoque-sku/dto/create-estoque-sku.dto';
import { uuidv7 } from 'uuidv7';
import { CreateFornecedorDto } from 'src/fornecedores/dto/create-fornecedor.dto';
import { CreatePedidoCompraDto } from 'src/pedido-compra/dto/create-pedido-compra.dto';
import {
  DescontoTipo,
  ParcelaStatus,
  PedidoCompra,
  Prisma,
  TipoVenda,
  VendaItemTipo,
  VendaStatus,
  VendaTipo,
} from '@prisma/client';
import { CreatePedidoCompraItemDto } from 'src/pedido-compra-item/dto/create-pedido-compra-item.dto';
import { VendaRollupService } from '../src/cash/vendas/venda-rollup.service';
import { LancamentoDreService } from '../src/lancamento-dre/lancamento-dre.service';

// Força o parceiro/usuário padrão para 1 durante a importação legado -> v2
const DEFAULT_PARCEIRO_ID = 1;
const DEFAULT_USUARIO_ID = 1;
const DEFAULT_LOCAL_SAIDA_ID = Number(process.env.SEED_LOCAL_SAIDA_ID ?? 1);

// Mapeamento de IDs de forma de pagamento v1 -> v2
const formaPagamentoMap = new Map<number, number>();

// Formas de pagamento a serem ignoradas na migração
// Nota: Parcelamento foi removido desta lista porque vendas parceladas precisam de pagamento
const IGNORED_FORMA_PAGAMENTO = ['Brinde', 'Permuta'];

const BRINDE_KEYWORDS = ['brinde'];
const PERMUTA_KEYWORDS = ['permuta'];
const PARCELAMENTO_KEYWORDS = ['parcel'];

const normalize = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const decimalOrUndefined = (value?: number | string | null) =>
  value === null || value === undefined ? undefined : new Prisma.Decimal(value);

const decimalOrZero = (value?: number | string | null) =>
  value === null || value === undefined
    ? new Prisma.Decimal(0)
    : new Prisma.Decimal(value);

const isPagamentoParcelado = (formaPagamentoNome?: string | null) =>
  normalize(formaPagamentoNome).length > 0 &&
  PARCELAMENTO_KEYWORDS.some(keyword =>
    normalize(formaPagamentoNome).includes(keyword),
  );

const includesKeyword = (value: string, list: string[]) =>
  list.some(keyword => value.includes(keyword));

function mapVendaTipo(
  legacyTipoVenda?: string | null,
  formaPagamentoNome?: string | null,
): VendaTipo {
  const pagamento = normalize(formaPagamentoNome);
  if (pagamento && includesKeyword(pagamento, BRINDE_KEYWORDS)) {
    return VendaTipo.BRINDE;
  }
  if (pagamento && includesKeyword(pagamento, PERMUTA_KEYWORDS)) {
    return VendaTipo.PERMUTA;
  }

  const tipo = normalize(legacyTipoVenda);
  if (
    tipo.includes('consig') ||
    tipo.includes('condic') ||
    tipo.includes('reserva')
  ) {
    return VendaTipo.CONDICIONAL;
  }
  return VendaTipo.DIRETA;
}

const mapVendaItemTipo = (vendaTipo: VendaTipo): VendaItemTipo => {
  switch (vendaTipo) {
    case VendaTipo.CONDICIONAL:
      return VendaItemTipo.CONDICIONAL;
    case VendaTipo.BRINDE:
      return VendaItemTipo.BRINDE;
    case VendaTipo.PERMUTA:
      return VendaItemTipo.PERMUTA;
    default:
      return VendaItemTipo.NORMAL;
  }
};

function mapVendaStatus(
  situacao: number | null | undefined,
  itens: any[],
  vendaTipo: VendaTipo,
): VendaStatus {
  // situacao = 1 sempre é PEDIDO (não finalizado)
  if (situacao === 1) {
    return VendaStatus.PEDIDO;
  }

  // Para vendas DIRETA, BRINDE e PERMUTA: sempre CONFIRMADA quando finalizadas
  if (
    vendaTipo === VendaTipo.DIRETA ||
    vendaTipo === VendaTipo.BRINDE ||
    vendaTipo === VendaTipo.PERMUTA
  ) {
    if (situacao === 2 || situacao === 3) {
      return VendaStatus.CONFIRMADA;
    }
    if (situacao === 4) {
      return VendaStatus.CANCELADA;
    }
  }

  // Para CONDICIONAL: analisar devoluções
  if (vendaTipo === VendaTipo.CONDICIONAL) {
    if (situacao === 4) {
      return VendaStatus.CANCELADA;
    }

    // situacao 2 = ABERTA em DOSv2 e 3 = finalizada
    if (situacao === 2) {
      return VendaStatus.ABERTA;
    }

    if (situacao === 3) {
      // Verificar se houve algum item NÃO confirmado (devolvido)
      const hasItemNaoConfirmado = itens?.some(
        item => item.confirmado === false,
      );

      // Se todos os itens foram confirmados = sem devoluções
      const todosConfirmados = itens?.every(
        item => item.confirmado === true,
      );

      if (todosConfirmados) {
        return VendaStatus.CONFIRMADA_TOTAL;
      } else if (hasItemNaoConfirmado) {
        return VendaStatus.CONFIRMADA_PARCIAL;
      } else {
        // Fallback: se não houver info de confirmação, assume total
        return VendaStatus.CONFIRMADA_TOTAL;
      }
    }
  }

  // Default: PEDIDO
  return VendaStatus.PEDIDO;
}

const CONFIRMED_VENDA_STATUSES: VendaStatus[] = [
  VendaStatus.CONFIRMADA,
  VendaStatus.CONFIRMADA_TOTAL,
  VendaStatus.CONFIRMADA_PARCIAL,
];

const isVendaConfirmada = (status: VendaStatus) =>
  CONFIRMED_VENDA_STATUSES.includes(status);

async function fetchDespesaFromLegacy(app, legacyDb, prisma: PrismaService) {
  console.log('🌱 Migrando Despesas');

  // Buscar despesas com o nome da subcategoria (ItensDespesas)
  const despesas = await legacyDb.query(`
    SELECT d.*, i.descricao as "subCategoriaDescricao"
    FROM public."Despesas" d
    LEFT JOIN public."ItensDespesas" i ON i."idItem" = d."itemId"
  `);

  const despesaService = app.get(DespesasService);

  // Cache de mapeamento subCategoria -> contaDreId
  const contaDreCache = new Map<string, number | null>();

  let migradas = 0;
  let semMapeamento = 0;

  for (const raw of despesas.rows) {
    // Buscar contaDreId baseado no nome da subcategoria (nomeV1)
    let contaDreId: number | undefined = undefined;

    if (raw.subCategoriaDescricao) {
      // Verificar cache primeiro
      if (contaDreCache.has(raw.subCategoriaDescricao)) {
        contaDreId = contaDreCache.get(raw.subCategoriaDescricao) ?? undefined;
      } else {
        // Buscar ContaDRE pelo nomeV1
        const contaDre = await prisma.contaDRE.findFirst({
          where: {
            parceiroId: DEFAULT_PARCEIRO_ID,
            nomeV1: raw.subCategoriaDescricao,
          },
          select: { id: true },
        });

        contaDreCache.set(raw.subCategoriaDescricao, contaDre?.id ?? null);
        contaDreId = contaDre?.id ?? undefined;

        if (!contaDre) {
          console.warn(
            `  ⚠ Sem mapeamento DRE para subcategoria: "${raw.subCategoriaDescricao}"`,
          );
        }
      }
    }

    console.log(
      `Criando a despesa: ${raw.descricao} (contaDreId: ${contaDreId ?? 'N/A'})`,
    );

    const dto: CreateDespesaDto = {
      tipoPagamento: TipoPagamentoEnum.A_VISTA_IMEDIATA,
      parceiroId: 1,
      currencyId: 1,
      descricao: raw.descricao,
      valorTotal: raw.valorDespesa,
      valorEntrada: 0,
      dataRegistro: raw.dataDespesa,
      subCategoriaId: raw.itemId,
      contaDreId: contaDreId,
    };

    await despesaService.create(dto, 1);
    migradas++;

    if (!contaDreId) {
      semMapeamento++;
    }
  }

  console.log(
    `✅ Despesas migradas: ${migradas}, sem mapeamento DRE: ${semMapeamento}`,
  );
}

async function fetchCategoriaFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Categorias de Despesas');
  const categorias = await legacyDb.query(
    'SELECT * FROM public."CategoriaDespesas"',
  );
  const categoriaService = app.get(CategoriaDespesasService);
  for (const raw of categorias.rows) {
    console.log(`Criando a categoria:${raw.descricao}`);
    const dto: CreateCategoriaDespesasDto = {
      idCategoria: raw.idCategoria,
      descricao: raw.descricao,
      ativo: true,
    };
    await categoriaService.create(dto);
  }
  // Ajustar o sequence para continuar a partir do maior ID inserido
  await categoriaService.resetIncrement();
}

async function fetchSubCategoriaFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Sub-Categorias de Despesas');
  const subcategorias = await legacyDb.query(
    'SELECT * FROM public."ItensDespesas" as id order by id."idItem" asc',
  );

  const subcategoriaService = app.get(SubCategoriaDespesaService);
  for (const raw of subcategorias.rows) {
    // mapeie do legado -> DTO do seu service
    console.log(`Criando a subcategoria:${raw.descricao}`);
    const dto: CreateSubCategoriaDespesaDto = {
      idSubCategoria: raw.idItem,
      categoriaId: raw.categoriaId,
      descricao: raw.descricao,
      ativo: true,
    };
    await subcategoriaService.create(dto);
  }

  // Ajustar o sequence para continuar a partir do maior ID inserido
  await subcategoriaService.resetIncrement();
}

async function fetchClientesFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Clientes');
  const clientes = await legacyDb.query(
    'SELECT * FROM public."Cliente" order by id asc',
  );

  const clienteService = app.get(ClientesService);
  for (const raw of clientes.rows) {
    console.log(`Criando o cliente:${raw.nome}`);
    const dto: CreateClienteDto = {
      id: raw.id,
      publicId: uuidv7(),
      parceiroId: 1,
      nome: raw.nome,
      email: raw.email,
      // Se o número de celular começar com +595, ele já está no formato correto
      // Se não tiver celular, deixa null. Se tiver, adiciona o +595 e remove o 0 inicial
      celular:
        !raw.celular || raw.celular.trim() === ''
          ? null
          : raw.celular.startsWith('+595')
            ? raw.celular
            : '+595' + raw.celular.replace('0', ''),
      redeSocial: raw.redeSocial,
      // cnpj em branco ou com length = 0 precisa ser null
      ruccnpj: raw.ruc,
      createdAt: raw.dataCadastro,
      updatedAt: raw.dataAtualizacao,
      ultimaCompra: raw.dataUltimaCompra ? raw.dataUltimaCompra : null,
      ativo: true,
    };
    await clienteService.create(dto);
  }
}

async function fetchPedidoCompraFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Pedidos de Compra');
  const pedidos = await legacyDb.query(
    'SELECT * FROM public."PedidoCompra" order by id asc',
  );

  const pedidoService = app.get(PedidoCompraService);
  const pedidoCompraItemService = app.get(PedidoCompraItemService);
  const fornecedorService = app.get(FornecedoresService);

  for (const raw of pedidos.rows) {
    // mapeie do legado -> DTO do seu service
    console.log(`Criando o pedido de compra:${raw.id}`);
    const dto: CreatePedidoCompraDto = {
      fornecedorId: raw.fornecedorId,
      localEntradaId: 1,
      valorTotal: raw.valorTotal,
      valorComissao: raw.valorComissao,
      valorFrete: raw.valorFrete,
      cotacao: raw.cotacao,
      currencyId: 2, // real
      consignado: false,
      // se dataCompra for null, setar a data atual
      dataPedido: raw.dataPedido,
      dataEntrega: raw.dataEntrega,
      status: 3,
      observacao: raw.observacao,
    };
    const pedido: PedidoCompra = await pedidoService.create(dto, 1);

    const itens = await legacyDb.query(
      'SELECT * FROM public."PedidoCompraItem" WHERE "pedidoCompraId" = $1 order by id asc',
      [raw.id],
    );

    for (const rowItens of itens.rows) {
      console.log(
        `  - Criando o item do pedido de compra: SKU ${rowItens.produtoVarianteId}`,
      );
      // mapeie do legado -> DTO do seu service
      const dtoItens: CreatePedidoCompraItemDto = {
        pedidoCompraId: pedido.id,
        skuId: rowItens.produtoVarianteId,
        precoCompra: rowItens.precoCompra,
        qtd: rowItens.qtd,
      };
      await pedidoCompraItemService.create(dtoItens, 1);
    }

    const fornecedor_publicId: string = await fornecedorService.findById(
      raw.fornecedorId,
    );
    console.log(
      `  - Atualizando a data da última compra do fornecedor: ${fornecedor_publicId}`,
    );
    if (fornecedor_publicId) {
      // Atualizar data da ultima compra do fornecedor
      await fornecedorService.update(fornecedor_publicId, {
        ultimaCompra: raw.dataPedido,
      });
    } else {
      console.log(
        `  - Fornecedor com id ${raw.fornecedorId} não encontrado, pulando atualização da última compra.`,
      );
    }
  }
}

async function fetchFornecedoresFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Fornecedores');
  const fornecedores = await legacyDb.query(
    'SELECT * FROM public."Fornecedor" order by id asc',
  );

  const fornecedorService = app.get(FornecedoresService);
  for (const raw of fornecedores.rows) {
    // mapeie do legado -> DTO do seu service
    console.log(`Criando o fornecedor:${raw.nome}`);
    const dto: CreateFornecedorDto = {
      id: raw.id,
      parceiroId: 1,
      nome: raw.nome,
      email: raw.email,
      telefone: raw.celular,
      redesocial: raw.redeSocial,
      ruccnpj: raw.ruc?.length > 0 ? raw.ruc : null,
      ultimaCompra: raw.dataUltimaCompra,
      ativo: true,
    };
    await fornecedorService.create(dto);
  }
}

async function fetchProdutosFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Produtos');
  const produtos = await legacyDb.query(
    'SELECT * FROM public."Produto" order by id asc',
  );

  const produtoService = app.get(ProdutoService);
  for (const raw of produtos.rows) {
    const precos = await legacyDb.query(
      'SELECT pv."produtoId", MAX(pv."precoCompra") AS maior_preco_compra, MAX(pv."precoVenda") AS maior_preco_venda FROM public."ProdutoVariante" as pv WHERE pv."produtoId" = $1 GROUP BY pv."produtoId"',
      [raw.id],
    );
    // mapeie do legado -> DTO do seu service
    console.log(`Criando o produto:${raw.nome}`);
    // se precos.rows[0] for undefined, setar os preços como zero
    if (!precos.rows[0]) {
      precos.rows[0] = {
        maior_preco_compra: 0,
        maior_preco_venda: 0,
      };
    }
    console.log(
      `preços de compra e venda: ${precos.rows[0].maior_preco_compra} - ${precos.rows[0].maior_preco_venda}`,
    );
    const dto: CreateProdutoDto = {
      id: raw.id,
      publicId: uuidv7(),
      parceiroId: 1,
      nome: raw.nome,
      dataCadastro: raw.dataCadastro,
      ativo: true,
      consignado: false,
      precoCompra: precos.rows[0].maior_preco_compra,
      precoVenda: precos.rows[0].maior_preco_venda,
    };
    const produto = await produtoService.create(dto, 1);

    let produtosSku = await legacyDb.query(
      'SELECT * FROM public."ProdutoVariante" where "produtoId" = $1 order by id asc',
      [raw.id],
    );
    const skuService = app.get(ProdutoSkuService);
    const estoqueService = app.get(EstoqueSkuService);
    for (const sku of produtosSku.rows) {
      console.log(`Criando o sku:${sku.cor}`);
      const dtoSku: CreateProdutoSkuDto = {
        id: sku.id,
        produtoId: produto.id,
        cor: sku.cor,
        tamanho: sku.tamanho,
        codCor: sku.codCor,
        qtdMinima: sku.qtdMinima,
        dataUltimaCompra: sku.dataUltimaCompra,
      };
      const skuCreated = await skuService.create(dtoSku, 1);
      const dtoEstoque: CreateEstoqueSkuDto = {
        localId: 1, // Estoque principal da migração
        skuId: skuCreated.id,
        qtd: sku.qtd,
      };
      await estoqueService.create(dtoEstoque);
    }
  }
}

async function fetchFormaPagamentoFromLegacy(legacyDb, prisma: PrismaService) {
  console.log('🌱 Migrando Formas de Pagamento');
  const formasPagamento = await legacyDb.query(
    'SELECT * FROM public."formaPagamento" ORDER BY "idFormaPag" ASC',
  );

  let migrated = 0;
  let skipped = 0;

  for (const raw of formasPagamento.rows) {
    // Ignorar formas de pagamento específicas
    if (IGNORED_FORMA_PAGAMENTO.includes(raw.nome)) {
      console.log(`  - Ignorando forma de pagamento: ${raw.nome}`);
      skipped++;
      continue;
    }

    // Verificar se já existe com o mesmo nome para o parceiro
    const existing = await prisma.formaPagamento.findFirst({
      where: {
        nome: raw.nome,
        parceiroId: DEFAULT_PARCEIRO_ID,
      },
      select: { idFormaPag: true },
    });

    if (existing) {
      formaPagamentoMap.set(raw.idFormaPag, existing.idFormaPag);
      console.log(
        `  - Forma de pagamento "${raw.nome}" já existe, usando ID ${existing.idFormaPag}`,
      );
      skipped++;
      continue;
    }

    console.log(`  - Criando forma de pagamento: ${raw.nome}`);
    const created = await prisma.formaPagamento.create({
      data: {
        parceiroId: DEFAULT_PARCEIRO_ID,
        nome: raw.nome,
        taxa: raw.taxa ? new Prisma.Decimal(raw.taxa) : new Prisma.Decimal(0),
        tempoLiberacao: 0,
        impostoPosCalculo: raw.ivaPosCalculo ?? false,
        ativo: true,
      },
    });

    // Mapear ID antigo para novo
    formaPagamentoMap.set(raw.idFormaPag, created.idFormaPag);
    migrated++;
  }

  console.log(
    `✅ Migração de formas de pagamento concluída: ${migrated} migradas, ${skipped} ignoradas/existentes.`,
  );
}

async function fetchVendasFromLegacy(
  legacyDb,
  prisma: PrismaService,
  vendaRollupService: VendaRollupService,
  lancamentoDreService: LancamentoDreService,
) {
  console.log('🌱 Migrando Vendas');
  const [usuario, parceiro, local] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: DEFAULT_USUARIO_ID },
      select: { id: true },
    }),
    prisma.parceiro.findUnique({
      where: { id: DEFAULT_PARCEIRO_ID },
      select: { id: true },
    }),
    prisma.localEstoque.findUnique({
      where: { id: DEFAULT_LOCAL_SAIDA_ID },
      select: { id: true },
    }),
  ]);

  if (!usuario || !parceiro || !local) {
    throw new Error(
      'IDs padrão de usuário, parceiro ou local de saída não encontrados. Configure as variáveis SEED_PARCEIRO_ID, SEED_USUARIO_ID e SEED_LOCAL_SAIDA_ID antes de migrar vendas.',
    );
  }

  const vendas = await legacyDb.query(`
    SELECT v.*, fp.nome as "formaPagamentoNome"
    FROM public."Venda" v
    LEFT JOIN public."formaPagamento" fp ON fp."idFormaPag" = v."formaPagamentoId"
    ORDER BY v."idVenda" ASC
  `);

  const total = vendas.rows.length;
  let migrated = 0;
  let skipped = 0;

  for (const raw of vendas.rows) {
    const itens = await legacyDb.query(
      'SELECT * FROM public."VendaItem" WHERE "vendaId" = $1 ORDER BY "idVendaItem" ASC',
      [raw.idVenda],
    );
    const legacyParcelamento = await legacyDb.query(
      'SELECT * FROM public."parcelamento" WHERE "vendaId" = $1 LIMIT 1',
      [raw.idVenda],
    );
    const parcelamentoRow = legacyParcelamento.rows[0];
    const parcelas = parcelamentoRow
      ? await legacyDb.query(
          'SELECT * FROM public."parcelas" WHERE "idParcelamento" = $1 ORDER BY "idparcela" ASC',
          [parcelamentoRow.id],
        )
      : { rows: [] };

    const itensValorBruto = itens.rows.reduce((sum: Prisma.Decimal, item) => {
      const preco = new Prisma.Decimal(item.precoVenda ?? 0);
      const qtd = new Prisma.Decimal(item.qtd ?? 0);
      return sum.add(preco.mul(qtd));
    }, new Prisma.Decimal(0));
    const valorTotalVenda =
      raw.valorTotal != null
        ? new Prisma.Decimal(raw.valorTotal)
        : itensValorBruto;

    // Calcular valor líquido (após desconto) para os pagamentos
    const vendaTipoResolved = mapVendaTipo(
      raw.tipoVenda,
      raw.formaPagamentoNome,
    );
    const isBrindeVenda = vendaTipoResolved === VendaTipo.BRINDE;
    const descontoVenda = isBrindeVenda
      ? new Prisma.Decimal(0)
      : decimalOrZero(raw.desconto);
    const valorLiquidoVenda = isBrindeVenda
      ? valorTotalVenda
      : valorTotalVenda.sub(descontoVenda);
    const descontoParaPersistir = isBrindeVenda
      ? undefined
      : decimalOrUndefined(raw.desconto);

    const vendaPersistida = await prisma.$transaction(async tx => {
      const vendaTipo = vendaTipoResolved;
      const vendaStatus = mapVendaStatus(raw.situacao, itens.rows, vendaTipo);

      const createdVenda = await tx.venda.create({
        data: {
          publicId: uuidv7(),
          idv1: raw.idVenda,
          usuarioId: DEFAULT_USUARIO_ID,
          parceiroId: DEFAULT_PARCEIRO_ID,
          localSaidaId: DEFAULT_LOCAL_SAIDA_ID,
          clienteId: raw.clienteId,
          tipo: vendaTipo,
          status: vendaStatus,
          dataVenda: raw.dataVenda,
          valorFrete: decimalOrUndefined(raw.valorDelivery),
          valorTotal: valorLiquidoVenda,
          desconto: descontoParaPersistir,
          ruccnpj: null,
          nomeFatura: raw.nomeFatura ?? null,
          numeroFatura: raw.faturaNumero ? raw.faturaNumero.toString() : null,
          observacao: raw.observacao ?? null,
          valorComissao: null,
        },
      });

      await migrateVendaItems(
        tx,
        createdVenda.id,
        itens.rows,
        vendaTipo,
        raw.situacao,
      );

      // Criar Pagamento apenas quando a venda estiver concluída
      const shouldCreatePagamento =
        vendaTipo === VendaTipo.DIRETA ||
        (vendaTipo === VendaTipo.CONDICIONAL &&
          vendaStatus !== VendaStatus.ABERTA);

      if (shouldCreatePagamento) {
        const formaPagamentoIdV2 = formaPagamentoMap.get(raw.formaPagamentoId);

        if (formaPagamentoIdV2) {
          const entregaInicial = new Prisma.Decimal(raw.entregaInicial ?? 0);
          const valorRestante = valorLiquidoVenda.sub(entregaInicial);
          const temParcelamento =
            !!parcelamentoRow || isPagamentoParcelado(raw.formaPagamentoNome);

          // Se há entrada inicial, criar pagamento de entrada
          if (entregaInicial.greaterThan(0)) {
            await tx.pagamento.create({
              data: {
                vendaId: createdVenda.id,
                formaPagamentoId: formaPagamentoIdV2,
                tipo: TipoVenda.A_VISTA_IMEDIATA,
                valor: entregaInicial,
                valorDelivery: decimalOrUndefined(raw.valorDelivery),
                entrada: true,
              },
            });

            // Se há valor restante
            if (valorRestante.greaterThan(0)) {
              if (temParcelamento) {
                // Criar pagamento do tipo PARCELADO para o valor restante
                await tx.pagamento.create({
                  data: {
                    vendaId: createdVenda.id,
                    formaPagamentoId: formaPagamentoIdV2,
                    tipo: TipoVenda.PARCELADO,
                    valor: valorRestante,
                    entrada: false,
                  },
                });
              } else {
                // Criar pagamento à vista do restante
                await tx.pagamento.create({
                  data: {
                    vendaId: createdVenda.id,
                    formaPagamentoId: formaPagamentoIdV2,
                    tipo: TipoVenda.A_VISTA_IMEDIATA,
                    valor: valorRestante,
                    entrada: false,
                  },
                });
              }
            }
          } else if (temParcelamento) {
            // Se não há entrada mas há parcelamento, criar pagamento PARCELADO do valor total
            await tx.pagamento.create({
              data: {
                vendaId: createdVenda.id,
                formaPagamentoId: formaPagamentoIdV2,
                tipo: TipoVenda.PARCELADO,
                valor: valorLiquidoVenda,
                valorDelivery: decimalOrUndefined(raw.valorDelivery),
                entrada: false,
              },
            });
          } else {
            // Se não há entrada e não há parcelamento, criar pagamento único à vista
            await tx.pagamento.create({
              data: {
                vendaId: createdVenda.id,
                formaPagamentoId: formaPagamentoIdV2,
                tipo: TipoVenda.A_VISTA_IMEDIATA,
                valor: valorLiquidoVenda,
                valorDelivery: decimalOrUndefined(raw.valorDelivery),
                entrada: false,
              },
            });
          }
        } else {
          console.warn(
            `  - Forma de pagamento ${raw.formaPagamentoId} não encontrada no mapeamento para venda ${raw.idVenda}`,
          );
        }
      }

      await migrateParcelamentoForVenda(
        tx,
        {
          vendaId: createdVenda.id,
          clienteId: raw.clienteId,
          valorTotal: valorLiquidoVenda,
          formaPagamentoNome: raw.formaPagamentoNome,
          entregaInicial: new Prisma.Decimal(raw.entregaInicial ?? 0),
        },
        parcelamentoRow,
        parcelas.rows,
      );

      return {
        vendaTipo,
        vendaStatus,
        valorTotalVenda,
        valorLiquidoVenda,
        createdVenda,
      };
    });

    const isConditionalVenda =
      vendaPersistida.vendaTipo === VendaTipo.CONDICIONAL;
    const isPermutaVenda = vendaPersistida.vendaTipo === VendaTipo.PERMUTA;
    const conditionalFinalizada =
      isConditionalVenda && Number(raw.situacao ?? 0) === 4;
    const isConfirmedVenda = isVendaConfirmada(vendaPersistida.vendaStatus);
    const shouldRegisterRollup =
      isConfirmedVenda &&
      !isPermutaVenda &&
      (!isConditionalVenda || conditionalFinalizada);

    if (shouldRegisterRollup) {
      await vendaRollupService.registerVendaConfirmada({
        parceiroId: vendaPersistida.createdVenda.parceiroId,
        dataVenda: vendaPersistida.createdVenda.dataVenda,
        tipo: vendaPersistida.vendaTipo,
        valorTotal: vendaPersistida.valorLiquidoVenda,
        descontoTotal: vendaPersistida.createdVenda.desconto ?? 0,
      });

      // Processar lançamento DRE para vendas confirmadas
      try {
        await lancamentoDreService.processarVenda(
          vendaPersistida.createdVenda.parceiroId,
          vendaPersistida.createdVenda.id,
        );
      } catch (dreError) {
        console.warn(
          `  ⚠ Erro ao processar DRE para venda ${vendaPersistida.createdVenda.id}: ${dreError.message}`,
        );
      }
    }

    migrated++;
    const shouldLogProgress =
      migrated <= 5 || // log early items to mostrar progresso imediato
      migrated % 25 === 0 ||
      migrated === total;
    if (shouldLogProgress) {
      console.log(`  - Venda ${raw.idVenda} migrada (${migrated}/${total})`);
    }
  }

  console.log(
    `✅ Migração de vendas concluída: ${migrated} migradas, ${skipped} já existiam.`,
  );
}

async function migrateVendaItems(
  tx: Prisma.TransactionClient,
  vendaId: number,
  legacyItens: any[],
  vendaTipo: VendaTipo,
  situacao?: number,
) {
  if (!legacyItens?.length) {
    return;
  }
  const itemTipo = mapVendaItemTipo(vendaTipo);

  // Para CONDICIONAL com situação >= 2, migrar apenas itens confirmados
  const isCondicionalFinalizada =
    vendaTipo === VendaTipo.CONDICIONAL && situacao && situacao >= 2;

  for (const item of legacyItens) {
    // Para condicionais finalizadas, ignorar itens não confirmados
    if (isCondicionalFinalizada && !item.confirmado) {
      continue;
    }

    const skuId = item.produtoVarianteId;
    const sku = await tx.produtoSKU.findUnique({
      where: { id: skuId },
      select: {
        id: true,
        produto: {
          select: {
            precoCompra: true,
          },
        },
      },
    });
    if (!sku) {
      console.warn(
        `SKU ${skuId} não encontrado para venda ${vendaId}, item ${item.idVendaItem} ignorado`,
      );
      continue;
    }

    const qtdReservada = Number(item.qtd ?? 0);
    const qtdDevolvida = Number(item.qtdDevolvida ?? 0);

    // Para CONDICIONAL finalizada: qtdAceita = qtdReservada (cliente ficou com tudo que foi confirmado)
    // Para outros casos: manter lógica original
    let qtdAceita: number;
    if (isCondicionalFinalizada) {
      qtdAceita = qtdReservada;
    } else {
      qtdAceita = item.confirmado
        ? Math.max(qtdReservada - qtdDevolvida, 0)
        : 0;
    }

    // Na v1, descontos eram sempre percentuais quando existiam
    const descontoValorV1 = item.desconto ? Number(item.desconto) : null;
    let temDesconto = descontoValorV1 !== null && descontoValorV1 > 0;

    // Para BRINDE: ignorar desconto (corrigir brindes com 100% de desconto)
    if (vendaTipo === VendaTipo.BRINDE && temDesconto) {
      console.log(
        `  - Removendo desconto ${descontoValorV1}% de brinde (venda ${vendaId}, item ${item.idVendaItem})`,
      );
      temDesconto = false;
    }

    // Calcular desconto absoluto se houver desconto percentual
    let descontoCalculado: Prisma.Decimal | undefined = undefined;
    if (temDesconto) {
      const precoUnit = new Prisma.Decimal(item.precoVenda ?? 0);
      const totalItem = precoUnit.mul(qtdReservada);
      // Desconto era sempre percentual na v1
      descontoCalculado = totalItem.mul(descontoValorV1).div(100);
    }

    await tx.vendaItem.create({
      data: {
        vendaId,
        skuId,
        tipo: itemTipo,
        qtdReservada,
        qtdAceita,
        qtdDevolvida: isCondicionalFinalizada ? 0 : qtdDevolvida,
        desconto: descontoCalculado,
        descontoTipo: temDesconto
          ? DescontoTipo.PERCENTUAL
          : DescontoTipo.VALOR,
        descontoValor: temDesconto
          ? new Prisma.Decimal(descontoValorV1)
          : undefined,
        precoUnit: decimalOrZero(item.precoVenda),
        custoCompra: sku.produto?.precoCompra
          ? new Prisma.Decimal(sku.produto.precoCompra)
          : new Prisma.Decimal(0),
        observacao: item.observacao ?? null,
      },
    });
  }
}

async function migrateParcelamentoForVenda(
  tx: Prisma.TransactionClient,
  context: {
    vendaId: number;
    clienteId: number;
    valorTotal: Prisma.Decimal;
    formaPagamentoNome?: string | null;
    entregaInicial?: Prisma.Decimal;
  },
  legacyParcelamento?: any,
  legacyParcelas?: any[],
) {
  const shouldCreateParcelamento =
    !!legacyParcelamento || isPagamentoParcelado(context.formaPagamentoNome);

  if (!shouldCreateParcelamento) {
    return;
  }

  const valorTotalParcelamento = legacyParcelamento?.valorTotal
    ? new Prisma.Decimal(legacyParcelamento.valorTotal)
    : context.valorTotal;
  const valorPagoLegacy = legacyParcelamento?.valorPago
    ? new Prisma.Decimal(legacyParcelamento.valorPago)
    : (context.entregaInicial ?? new Prisma.Decimal(0));

  const parcelamento = await tx.parcelamento.create({
    data: {
      vendaId: context.vendaId,
      clienteId: context.clienteId,
      valorTotal: valorTotalParcelamento.toNumber(),
      valorPago: valorPagoLegacy.toNumber(),
      situacao: legacyParcelamento?.situacao ?? 1,
    },
  });

  await tx.venda.update({
    where: { id: context.vendaId },
    data: { parcelamentoId: parcelamento.id },
  });

  let numeroSequencial = 1;
  let totalPago = new Prisma.Decimal(0);
  const parcelasRows = legacyParcelas ?? [];

  // Buscar a data da venda uma vez para usar como fallback
  let dataVendaFallback: Date | null = null;
  if (parcelasRows.length > 0) {
    const venda = await tx.venda.findUnique({
      where: { id: context.vendaId },
      select: { dataVenda: true },
    });
    dataVendaFallback = venda?.dataVenda ?? new Date();
  }

  for (const parcela of parcelasRows) {
    const valor = new Prisma.Decimal(parcela.valorPago ?? 0);
    totalPago = totalPago.add(valor);
    // Se a parcela está sendo marcada como PAGA, deve ter uma data de recebimento
    const recebidoEm = parcela.dataPagamento
      ? new Date(parcela.dataPagamento)
      : dataVendaFallback;
    await tx.parcelas.create({
      data: {
        parcelamentoId: parcelamento.id,
        numero: numeroSequencial++,
        valor: valor,
        vencimento: null,
        recebidoEm,
        status: ParcelaStatus.PAGO,
      },
    });
  }

  // Se não há parcelas no legado mas há valor pago NO PARCELAMENTO DO LEGADO,
  // criar uma parcela já paga. Não criar se valorPago vem apenas da entregaInicial
  // (que já foi registrada como Pagamento separado)
  const valorPagoDoParcelamentoLegado = legacyParcelamento?.valorPago
    ? new Prisma.Decimal(legacyParcelamento.valorPago)
    : new Prisma.Decimal(0);

  if (!parcelasRows.length && valorPagoDoParcelamentoLegado.greaterThan(0)) {
    totalPago = totalPago.add(valorPagoDoParcelamentoLegado);
    // Buscar a data da venda para usar como data de recebimento
    const venda = await tx.venda.findUnique({
      where: { id: context.vendaId },
      select: { dataVenda: true },
    });
    await tx.parcelas.create({
      data: {
        parcelamentoId: parcelamento.id,
        numero: numeroSequencial++,
        valor: valorPagoDoParcelamentoLegado,
        vencimento: null,
        recebidoEm: venda?.dataVenda ?? new Date(),
        status: ParcelaStatus.PAGO,
      },
    });
  }

  // NÃO criar parcelas PENDENTES na migração - apenas migrar parcelas já pagas
  // O saldo pendente será gerenciado pelo sistema quando o usuário registrar pagamentos
  const saldoRestante = valorTotalParcelamento.sub(totalPago);

  await tx.parcelamento.update({
    where: { id: parcelamento.id },
    data: {
      valorPago: totalPago.toNumber(),
      situacao: saldoRestante.greaterThan(0) ? 1 : 2,
    },
  });
}

async function run() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  const legacyDb = new Client({
    connectionString: process.env.LEGACY_DATABASE_URL,
  });
  await legacyDb.connect();
  try {
    console.log('🌱 Iniciando migração DOSv1 para DOSv2...');
    console.log('PATH:', process.env.LEGACY_DATABASE_URL);
    const prisma = app.get(PrismaService);
    const vendaRollupService = app.get(VendaRollupService);
    const lancamentoDreService = app.get(LancamentoDreService);

    await fetchCategoriaFromLegacy(app, legacyDb);
    await fetchSubCategoriaFromLegacy(app, legacyDb);
    await fetchDespesaFromLegacy(app, legacyDb, prisma);
    await fetchClientesFromLegacy(app, legacyDb);
    await fetchProdutosFromLegacy(app, legacyDb);
    await fetchFornecedoresFromLegacy(app, legacyDb);
    await fetchPedidoCompraFromLegacy(app, legacyDb);

    // Migrar formas de pagamento antes das vendas (para ter o mapeamento de IDs)
    await fetchFormaPagamentoFromLegacy(legacyDb, prisma);

    // Criar regras de lançamento DRE antes de migrar vendas
    console.log('🌱 Criando regras de lançamento DRE...');
    const regrasResult = await lancamentoDreService.criarRegrasVendaPadrao(
      DEFAULT_PARCEIRO_ID,
    );
    console.log(
      `✅ Regras DRE: ${regrasResult.criadas} criadas, ${regrasResult.existentes} já existiam`,
    );

    await fetchVendasFromLegacy(
      legacyDb,
      prisma,
      vendaRollupService,
      lancamentoDreService,
    );

    legacyDb.end();
    console.log('Seed concluído com sucesso.');
  } catch (err) {
    console.error('Seed falhou:', err);
    process.exitCode = 1;
  } finally {
    await app.close(); // encerra Prisma/DI
  }
}

run();
