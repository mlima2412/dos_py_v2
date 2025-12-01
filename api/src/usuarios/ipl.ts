import { uuidv7 } from 'uuidv7';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export async function ensureSystemInitialized(prisma: PrismaService) {
  // Criar moedas básicas apenas se não existirem
  let guarani = await prisma.currency.findFirst({ where: { isoCode: 'PYG' } });
  if (!guarani) {
    guarani = await prisma.currency.create({
      data: {
        publicId: uuidv7(),
        nome: 'Guaraní',
        prefixo: '₲',
        isoCode: 'PYG',
        precision: 0,
        locale: 'es-PY',
        defaultRate: 1,
        ativo: true,
      },
    });
    console.log('Moeda Guarani criada.');
  } else {
    console.log('Moeda Guarani já existe.');
  }
  let real = await prisma.currency.findFirst({ where: { isoCode: 'BRL' } });
  if (!real) {
    real = await prisma.currency.create({
      data: {
        publicId: uuidv7(),
        nome: 'Real',
        prefixo: 'R$',
        isoCode: 'BRL',
        precision: 2,
        locale: 'pt-BR',
        defaultRate: 0.0007,
        ativo: true,
      },
    });
    console.log('Moeda Real criada.');
  } else {
    console.log('Moeda Real já existe.');
  }

  // Criar parceiro DOS PY apenas se não existir
  let parceiro = await prisma.parceiro.findFirst({
    where: { nome: 'DOS PY' },
  });
  if (!parceiro) {
    parceiro = await prisma.parceiro.create({
      data: {
        publicId: uuidv7(),
        nome: 'DOS PY',
        email: 'admin@dospy.com.py',
        currencyId: guarani.id,
        ativo: true,
      },
    });
    console.log('Parceiro DOS PY criado.');
    await prisma.localEstoque.create({
      data: {
        publicId: uuidv7(),
        nome: 'Principal',
        descricao: 'Local de estoque principal DOS PY',
        endereco: 'Residencia dos MORES',
        parceiroId: parceiro.id,
      },
    });
    console.log('Local de estoque principal criado para DOS PY.');
  } else {
    console.log('Parceiro DOS PY já existe.');
  }

  // Criar parceiro inativo para teste apenas se não existir
  let parceiroInativo = await prisma.parceiro.findFirst({
    where: { nome: 'PARCEIRO INATIVO TESTE' },
  });
  if (!parceiroInativo) {
    parceiroInativo = await prisma.parceiro.create({
      data: {
        publicId: uuidv7(),
        nome: 'PARCEIRO INATIVO TESTE',
        email: 'inativo@teste.com',
        ativo: false,
      },
    });
    console.log('Parceiro inativo de teste criado.');
  } else {
    console.log('Parceiro inativo de teste já existe.');
  }
  const perfil = await prisma.perfil.findFirst();
  const adminEmail = 'mlima001@gmail.com';
  const admin = await prisma.usuario.findFirst({
    where: { email: adminEmail },
  });

  if (!perfil) {
    const perfils = [
      {
        nome: 'ADMIN',
        ativo: true,
      },
      {
        nome: 'GERENTE',
        ativo: true,
      },
      {
        nome: 'VENDEDOR',
        ativo: true,
      },
      {
        nome: 'CLIENTE',
        ativo: true,
      },
      {
        nome: 'COMPRAS',
        ativo: true,
      },
    ];
    await prisma.perfil.createMany({
      data: perfils,
    });
    console.log('Perfis criados automaticamente.');
  } else {
    console.log('Perfis já existem.');
  }

  // Garantir que o perfil ADMIN existe
  let perfilAdmin = await prisma.perfil.findFirst({
    where: { nome: 'ADMIN' },
  });
  if (!perfilAdmin) {
    perfilAdmin = await prisma.perfil.create({
      data: {
        nome: 'ADMIN',
        ativo: true,
      },
    });
    console.log('Perfil ADMIN criado.');
  } else {
    console.log('Perfil ADMIN já existe.');
  }

  let usuarioAdmin = admin;
  if (!usuarioAdmin) {
    usuarioAdmin = await prisma.usuario.create({
      data: {
        publicId: uuidv7(),
        nome: 'Admin',
        email: adminEmail,
        provider: 'GOOGLE',
        googleId: adminEmail,
        senha: null,
        ativo: true,
      },
    });
    console.log('Admin criado automaticamente.');
  } else {
    const needsUpdate =
      usuarioAdmin.provider !== 'GOOGLE' || usuarioAdmin.senha !== null;
    if (needsUpdate) {
      usuarioAdmin = await prisma.usuario.update({
        where: { id: usuarioAdmin.id },
        data: {
          provider: 'GOOGLE',
          googleId: usuarioAdmin.googleId || adminEmail,
          senha: null,
        },
      });
      console.log('Admin atualizado para usar login com Google.');
    } else {
      console.log('Admin já existe.');
    }
  }

  // Garantir vínculo UsuarioParceiro
  const vinculo = await prisma.usuarioParceiro.findFirst({
    where: {
      usuarioId: usuarioAdmin.id,
      perfilId: perfilAdmin.id,
      parceiroId: parceiro.id,
    },
  });
  if (!vinculo) {
    await prisma.usuarioParceiro.create({
      data: {
        usuarioId: usuarioAdmin.id,
        perfilId: perfilAdmin.id,
        parceiroId: parceiro.id,
      },
    });
    console.log('Vínculo UsuarioParceiro criado para admin.');
  } else {
    console.log('Vínculo UsuarioParceiro já existe para admin.');
  }

  // Criar usuário de teste para parceiro inativo
  const testUserEmail = 'teste.inativo@gmail.com';
  let testUser = await prisma.usuario.findUnique({
    where: { email: testUserEmail },
  });

  if (!testUser) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    testUser = await prisma.usuario.create({
      data: {
        publicId: uuidv7(),
        nome: 'Usuário Teste Inativo',
        email: testUserEmail,
        senha: hashedPassword,
        telefone: '123456789',
        ativo: true,
      },
    });
    console.log('Usuário de teste para parceiro inativo criado.');
  } else {
    console.log('Usuário de teste para parceiro inativo já existe.');
  }

  // Criar vínculo UsuarioParceiro para o usuário de teste com parceiro inativo
  const usuarioParceiroInativoExistente =
    await prisma.usuarioParceiro.findFirst({
      where: {
        usuarioId: testUser.id,
        parceiroId: parceiroInativo.id,
      },
    });

  if (!usuarioParceiroInativoExistente) {
    await prisma.usuarioParceiro.create({
      data: {
        usuarioId: testUser.id,
        parceiroId: parceiroInativo.id,
        perfilId: perfilAdmin.id,
      },
    });
    console.log(
      'Vínculo UsuarioParceiro criado para usuário de teste com parceiro inativo.',
    );
  } else {
    console.log(
      'Vínculo UsuarioParceiro já existe para usuário de teste com parceiro inativo.',
    );
  }
}
