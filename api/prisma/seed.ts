import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';

import { Client } from 'pg';
import { DespesasService } from '../src/despesas/despesas.service';
import { CategoriaDespesasService } from '../src/categoria-despesas/categoria-despesas.service';
import { SubCategoriaDespesaService } from '../src/subcategoria-despesa/subcategoria-despesa.service';
import { ClientesService } from '../src/clientes/clientes.service';
import { ProdutoService } from '../src/produto/produto.service';

import {
  CreateDespesaDto,
  TipoPagamento as TipoPagamentoEnum,
} from '../src/despesas/dto/create-despesa.dto';
import { CreateCategoriaDespesasDto } from '../src/categoria-despesas/dto/create-categoria-despesas.dto';
import { CreateSubCategoriaDespesaDto } from '../src/subcategoria-despesa/dto/create-subcategoria-despesa.dto';
import { CreateClienteDto } from '../src/clientes/dto/create-cliente.dto';
import { CreateProdutoDto } from '../src/produto/dto/create-produto.dto';
import { uuidv7 } from 'uuidv7';

async function fetchDespesaFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Despesas');
  const despesas = await legacyDb.query('SELECT * FROM public."Despesas"');
  const despesaService = app.get(DespesasService);
  for (const raw of despesas.rows) {
    // mapeie do legado -> DTO do seu service
    console.log(`Criando a despesa:${raw.descricao}`);
    const dto: CreateDespesaDto = {
      tipoPagamento: TipoPagamentoEnum.A_VISTA_IMEDIATA,
      parceiroId: 1,
      currencyId: 1,
      descricao: raw.descricao,
      valorTotal: raw.valorDespesa,
      valorEntrada: 0,
      dataRegistro: raw.dataDespesa,
      subCategoriaId: raw.itemId,
    };

    await despesaService.create(dto, 1);
  }
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
}

async function fetchSubCategoriaFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Sub-Categorias de Despesas');
  const subcategorias = await legacyDb.query(
    'SELECT * FROM public."ItensDespesas"',
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
}

async function fetchClientesFromLegacy(app, legacyDb) {
  console.log('🌱 Migrando Clientes');
  const clientes = await legacyDb.query(
    'SELECT * FROM public."Cliente" order by id asc',
  );

  const clienteService = app.get(ClientesService);
  for (const raw of clientes.rows) {
    // mapeie do legado -> DTO do seu service
    console.log(`Criando o cliente:${raw.nome}`);
    const dto: CreateClienteDto = {
      id: raw.id,
      publicId: uuidv7(),
      parceiroId: 1,
      nome: raw.nome.split(' ')[0],
      // o sobrenome precisa ser todo o resto do nome
      sobrenome: raw.nome.split(' ').slice(1).join(' '),
      email: raw.email,
      // Se o número de celular começar com +595, ele já está no formato correto
      // Se não, adiciona o +595 e remove o 0 inicial
      celular: raw.celular?.startsWith('+595')
        ? raw.celular
        : '+595' + raw.celular?.replace('0', ''),
      redeSocial: raw.redeSocial,
      // cnpj em branco ou com lenght = 0 precisa ser null
      ruccnpj: raw.ruc?.lenght > 0 ? raw.ruc : null,
      createdAt: raw.dataCadastro,
      updatedAt: raw.dataAtualizacao,
      ultimaCompra: raw.dataUltimaCompra ? raw.dataUltimaCompra : null,
      ativo: true,
    };
    await clienteService.create(dto);
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
    await produtoService.create(dto, 1);
  }
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

    // await fetchCategoriaFromLegacy(app, legacyDb);
    // await fetchSubCategoriaFromLegacy(app, legacyDb);
    // await fetchDespesaFromLegacy(app, legacyDb);
    // await fetchClientesFromLegacy(app, legacyDb);
    await fetchProdutosFromLegacy(app, legacyDb);

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

// // Criar perfil admin primeiro
// const perfil = await prisma.perfil.upsert({
//   where: { id: 1 },
//   update: {},
//   create: {
//     id: 1,
//     nome: 'ADMIN',
//     ativo: true,
//   },
// });

// // Hash da senha padrão
// const senhaHash = await bcrypt.hash('123456', 10);

// // Criar usuário admin de teste
// const usuarios = Array.from({ length: 1000 }).map(() => {
//   return {
//     publicId: uuidv7(),
//     nome: faker.person.fullName(),
//     email: faker.internet.email(),
//     telefone: faker.phone.number(),
//     provider: 'LOCAL',
//     senha: senhaHash,
//     ativo: true,
//     avatar: '',
//   };
//});
