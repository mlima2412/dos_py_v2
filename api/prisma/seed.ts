import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';

import { Client } from 'pg';
import { DespesasService } from '../src/despesas/despesas.service';
import { CategoriaDespesasService } from '../src/categoria-despesas/categoria-despesas.service';
import { SubCategoriaDespesaService } from '../src/subcategoria-despesa/subcategoria-despesa.service';
import { ClientesService } from '../src/clientes/clientes.service';

import {
  CreateDespesaDto,
  TipoPagamento as TipoPagamentoEnum,
} from '../src/despesas/dto/create-despesa.dto';
import { CreateCategoriaDespesasDto } from '../src/categoria-despesas/dto/create-categoria-despesas.dto';
import { CreateSubCategoriaDespesaDto } from '../src/subcategoria-despesa/dto/create-subcategoria-despesa.dto';
import { CreateClienteDto } from '../src/clientes/dto/create-cliente.dto';
import { uuidv7 } from 'uuidv7';

async function fetchDespesaFromLegacy(legacyDb) {
  console.log('🌱 Migrando Categoria de Despesas');
  const despesas = await legacyDb.query('SELECT * FROM public."Despesas"');
  return despesas.rows;
}

async function fetchCategoriaFromLegacy(legacyDb) {
  console.log('🌱 Migrando Categorias de Despesas');
  const categorias = await legacyDb.query(
    'SELECT * FROM public."CategoriaDespesas"',
  );

  return categorias.rows;
}

async function fetchSubCategoriaFromLegacy(legacyDb) {
  console.log('🌱 Migrando Categorias de Despesas');
  const subcategorias = await legacyDb.query(
    'SELECT * FROM public."ItensDespesas"',
  );

  return subcategorias.rows;
}

async function fetchClientesFromLegacy(legacyDb) {
  console.log('🌱 Migrando Clientes');
  const clientes = await legacyDb.query(
    'SELECT * FROM public."Cliente" order by id asc',
  );
  return clientes.rows;
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
    /*
    const categoriaLegacy = await fetchCategoriaFromLegacy(legacyDb);
    const categoriaService = app.get(CategoriaDespesasService);
    for (const raw of categoriaLegacy) {
      // mapeie do legado -> DTO do seu service
      console.log(`Criando a categoria:${raw.descricao}`);
      const dto: CreateCategoriaDespesasDto = {
        idCategoria: raw.idCategoria,
        descricao: raw.descricao,
        ativo: true,
      };
      await categoriaService.create(dto);
    }

    const subcategoriaLegacy = await fetchSubCategoriaFromLegacy(legacyDb);
    const subcategoriaService = app.get(SubCategoriaDespesaService);
    for (const raw of subcategoriaLegacy) {
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

    const despesasLegacy = await fetchDespesaFromLegacy(legacyDb);
    const despesaService = app.get(DespesasService);
    for (const raw of despesasLegacy) {
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
  */

    const clientesLegacy = await fetchClientesFromLegacy(legacyDb);
    const clienteService = app.get(ClientesService);
    for (const raw of clientesLegacy) {
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
