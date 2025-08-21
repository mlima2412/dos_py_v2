import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';

import { Client } from 'pg';
import { DespesasService } from '../src/despesas/despesas.service';
import { CategoriaDespesasService } from '../src/categoria-despesas/categoria-despesas.service'
import { SubCategoriaDespesaService } from '../src/subcategoria-despesa/subcategoria-despesa.service'

import { CreateDespesaDto, TipoPagamento as TipoPagamentoEnum } from '../src/despesas/dto/create-despesa.dto';
import { CreateCategoriaDespesasDto } from '../src/categoria-despesas/dto/create-categoria-despesas.dto'
import { CreateSubCategoriaDespesaDto } from 'src/subcategoria-despesa/dto/create-subcategoria-despesa.dto'

async function fetchDespesaFromLegacy(legacyDb) {
 
  console.log('🌱 Migrando Categoria de Despesas');
  const despesas = await legacyDb.query('SELECT * FROM public."Despesas"');
  return despesas.rows
}

async function fetchCategoriaFromLegacy(legacyDb) {
  console.log('🌱 Migrando Categorias de Despesas');
  const categorias = await legacyDb.query('SELECT * FROM public."CategoriaDespesas"');

  return categorias.rows
}

async function fetchSubCategoriaFromLegacy(legacyDb) {
  console.log('🌱 Migrando Categorias de Despesas');
  const subcategorias = await legacyDb.query('SELECT * FROM public."ItensDespesas"');

  return subcategorias.rows
}



async function run() {
  // Sobe o Nest sem HTTP/Express (só DI)
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  const legacyDb = new Client({
    connectionString: process.env.LEGACY_DATABASE_URL,
  });
  await legacyDb.connect();
  try {
    

    console.log('🌱 Iniciando migração DOSv1 para DOSv2 Módulo Despesas...');
    console.log("PATH:",process.env.LEGACY_DATABASE_URL )

    // const categoriaLegacy = await fetchCategoriaFromLegacy(legacyDb);
    // const categoriaService = app.get(CategoriaDespesasService);
    // for (const raw of categoriaLegacy) {
    //   // mapeie do legado -> DTO do seu service
    //   console.log(`Criando a categoria:${raw.descricao}`)
    //   const dto: CreateCategoriaDespesasDto = {
    //     idCategoria: raw.idCategoria,
    //     descricao: raw.descricao,
    //     ativo: true,
    //   };
    //   await categoriaService.create(dto);
    // }

    // const subcategoriaLegacy = await fetchSubCategoriaFromLegacy(legacyDb);
    // const subcategoriaService = app.get(SubCategoriaDespesaService);
    // for (const raw of subcategoriaLegacy) {
    //   // mapeie do legado -> DTO do seu service
    //   console.log(`Criando a subcategoria:${raw.descricao}`)
    //   const dto: CreateSubCategoriaDespesaDto = {
    //     idSubCategoria: raw.idItem,
    //     categoriaId: raw.categoriaId,
    //     descricao: raw.descricao,
    //     ativo: true,
    //   };
    //   await subcategoriaService.create(dto);
    // }


    // const subcategoriaService = app.get(SubCategoriaDespesaService);
    const despesasLegacy = await fetchDespesaFromLegacy(legacyDb);
    const despesaService = app.get(DespesasService);
    for (const raw of despesasLegacy) {
      // mapeie do legado -> DTO do seu service
      console.log(`Criando a despesa:${raw.descricao}`)
      const dto: CreateDespesaDto = {
        tipoPagamento: TipoPagamentoEnum.A_VISTA_IMEDIATA,
        parceiroId: 5,
        currencyId: 1,
        descricao: raw.descricao,
        valorTotal: raw.valorDespesa,
        valorEntrada: 0,
        dataRegistro: raw.dataDespesa,
        subCategoriaId: raw.itemId,
      };

      await despesaService.create(dto, 5);
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
