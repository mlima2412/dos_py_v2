import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando migração DOSv1 para DOSv2...');
  console.log("PATH:",process.env.LEGACY_DATABASE_URL )
  const legacyDb = new Client({
    connectionString: process.env.LEGACY_DATABASE_URL,
  });
  await legacyDb.connect();
  console.log('🌱 Migrando Categoria de Despesas');
  const categorias = await legacyDb.query('SELECT * FROM public."CategoriaDespesas"');
  categorias.rows.forEach(async (categoria) => {
    categoria.id = Number(categoria.id);
    await prisma.categoriaDespesas.create({
      data: {
        idCategoria: categoria.idCategoria,
        descricao: categoria.descricao,
        createdAt: new Date(),
      },
    });
  });
  console.log('🌱 Migrando SubCategoria de Despesas');
  const subcategorias = await legacyDb.query('SELECT * FROM public."ItensDespesas"');
  subcategorias.rows.forEach(async (subcategoria) => {
    subcategoria.id = Number(subcategoria.id);
    await prisma.subCategoriaDespesa.create({
      data: {
        idSubCategoria: subcategoria.idItem,
        categoriaId:subcategoria.categoriaId,
        descricao: subcategoria.descricao,
      },
    });
  });
  
  // Insere os dados no banco de dados de forma massiva

  
  legacyDb.end();
  // // Buscar todos os usuários criados
  // const usuariosCriados = await prisma.usuario.findMany({ select: { id: true } });

  // // Criar relação usuario_parceiro para cada usuário, associando ao perfil admin
  // await prisma.usuarioParceiro.createMany({
  //   data: usuariosCriados.map((u) => ({
  //     usuarioId: u.id,
  //     perfilId: perfil.id,
  //     parceiroId: 1, // ajuste conforme necessário para o parceiro padrão
  //   })),
  //   skipDuplicates: true,
  // });

  //const perfis = await oldPrisma.categoria.findMany();

  console.log('✅ Seed concluído com sucesso!');
  console.log('👤 Usuários criados:');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





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
