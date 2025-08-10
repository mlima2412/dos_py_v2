import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar perfil admin primeiro
  const perfil = await prisma.perfil.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nome: 'ADMIN',
      ativo: true,
    },
  });

  // Hash da senha padrão
  const senhaHash = await bcrypt.hash('123456', 10);

  // Criar usuário admin de teste
  const usuarios = Array.from({ length: 1000 }).map(() => {
    return {
      publicId: uuidv7(),
      nome: faker.person.fullName(),
      email: faker.internet.email(),
      telefone: faker.phone.number(),
      provider: 'LOCAL',
      senha: senhaHash,
      ativo: true,
      avatar: '',
    };
  });
  // Insere os dados no banco de dados de forma massiva
  await prisma.usuario.createMany({
    data: usuarios,
  });

  // Buscar todos os usuários criados
  const usuariosCriados = await prisma.usuario.findMany({ select: { id: true } });

  // Criar relação usuario_parceiro para cada usuário, associando ao perfil admin
  await prisma.usuarioParceiro.createMany({
    data: usuariosCriados.map((u) => ({
      usuarioId: u.id,
      perfilId: perfil.id,
      parceiroId: 1, // ajuste conforme necessário para o parceiro padrão
    })),
    skipDuplicates: true,
  });

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
