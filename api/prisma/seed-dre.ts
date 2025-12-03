import { PrismaClient, TipoDRE } from '@prisma/client';
import { uuidv7 } from 'uuidv7';

const prisma = new PrismaClient();

/**
 * Seed dos Grupos DRE padrão
 * Estes grupos são globais (não dependem de parceiro)
 */
async function seedGruposDRE() {
  console.log('🌱 Criando Grupos DRE padrão...');

  const grupos = [
    {
      codigo: '1000',
      nome: 'Receitas de Vendas',
      tipo: TipoDRE.RECEITA,
      ordem: 1,
    },
    {
      codigo: '2000',
      nome: 'Deduções sobre Receita',
      tipo: TipoDRE.DEDUCAO,
      ordem: 2,
    },
    { codigo: '3000', nome: 'Custos (CMV)', tipo: TipoDRE.CUSTO, ordem: 3 },
    { codigo: '4000', nome: 'Custos Variáveis', tipo: TipoDRE.CUSTO, ordem: 4 },
    {
      codigo: '5100',
      nome: 'Despesas com Pessoal',
      tipo: TipoDRE.DESPESA,
      ordem: 5,
    },
    {
      codigo: '5200',
      nome: 'Despesas Administrativas',
      tipo: TipoDRE.DESPESA,
      ordem: 6,
    },
    {
      codigo: '5300',
      nome: 'Despesas Operacionais',
      tipo: TipoDRE.DESPESA,
      ordem: 7,
    },
    {
      codigo: '5400',
      nome: 'Despesas Comerciais',
      tipo: TipoDRE.DESPESA,
      ordem: 8,
    },
    {
      codigo: '5500',
      nome: 'Despesas Tributárias',
      tipo: TipoDRE.DESPESA,
      ordem: 9,
    },
    {
      codigo: '6100',
      nome: 'Receitas Financeiras',
      tipo: TipoDRE.RECEITA,
      ordem: 10,
    },
    {
      codigo: '6200',
      nome: 'Despesas Financeiras',
      tipo: TipoDRE.DESPESA,
      ordem: 11,
    },
  ];

  for (const grupo of grupos) {
    await prisma.grupoDRE.upsert({
      where: { codigo: grupo.codigo },
      update: {},
      create: {
        publicId: uuidv7(),
        ...grupo,
      },
    });
    console.log(`  ✓ Grupo ${grupo.codigo} - ${grupo.nome}`);
  }

  console.log('✅ Grupos DRE criados com sucesso!');
}

/**
 * Mapeamento de SubCategoriaDespesa (V1) para GrupoDRE
 * Baseado na planilha "Planilha Padrão - DRE_DFC.xlsx"
 */
const mapeamentoV1ParaDRE: Record<string, string> = {
  // CMV (3000)
  Aviamento: '3000',
  Bojos: '3000',
  Corte: '3000',
  Costura: '3000',
  Embalagens: '3000',
  Essências: '3000',
  'Etiquetas e Tags': '3000',
  Facção: '3000',
  'Insumos para produção': '3000',
  Meias: '3000',
  Silk: '3000',
  Tecidos: '3000',
  'Compra de Produtos': '3000', // Obrigatória para pedidos de compra

  // Custos Variáveis (4000)
  'Comissão sobre vendas': '4000',
  'Fretes de entregas': '4000',

  // Despesas com Pessoal (5100)
  '13º Salário': '5100',
  'Alimentação de Colaboradores': '5100',
  'Bônus Colaboradores': '5100',
  'Cesta Básica': '5100',
  'Cursos e treinamentos': '5100',
  'Décimo Terceiro': '5100',
  'Exames Admissionais e Demissionais': '5100',
  Férias: '5100',
  FGTS: '5100',
  'Horas Extras': '5100',
  INSS: '5100',
  IRRF: '5100',
  'Pró-labore Sócio 1': '5100',
  'Pró-labore Sócio 2': '5100',
  Rescisão: '5100',
  'Roupas Profissionais/Uniformes/EPI/EPC': '5100',
  Salários: '5100',
  Uniformes: '5100',
  'Vale transporte': '5100',

  // Despesas Administrativas (5200)
  'Água e Saneamento': '5200',
  'Aluguel de Imóvel': '5200',
  'Álvaras e Licenças de Funcionamento': '5200',
  'Aquisição de Sistemas e Softwares': '5200',
  'Assessorias e Consultorias': '5200',
  'Computadores e Periféricos': '5200',
  Contabilidade: '5200',
  'Copa e Cozinha': '5200',
  'Cópias e Impressões': '5200',
  'Despesas a identificar': '5200',
  'Despesas com viagens': '5200',
  'Despesas com Veículos': '5200',
  Energia: '5200',
  'Energia Solar': '5200',
  Estacionamentos: '5200',
  'Fretes sobre aquisições': '5200',
  'Honorários Advocatícios': '5200',
  'Hospedagens e Passagens': '5200',
  Imobilizado: '5200',
  'Insumos para informática': '5200',
  'Materiais de Escritório': '5200',
  'Materiais de Limpeza e Higiene': '5200',
  'Móveis e Utensílios': '5200',
  'Presentes de aniversariantes': '5200',
  'Reformas Prediais': '5200',
  'Seguros de veículos': '5200',
  'Serviços terceirizados': '5200',
  Sistemas: '5200',
  'Taxas Cartorárias': '5200',
  'Telefonia e Internet': '5200',
  'Vigilância e Segurança Patrimonial': '5200',

  // Despesas Operacionais (5300)
  Combustível: '5300',
  'Manutenção de Máquinas e Equipamentos': '5300',
  'Manutenção de Veículos': '5300',
  'Manutenção Predial': '5300',
  Modelista: '5300',

  // Despesas Comerciais (5400)
  'Assessoria Site': '5400',
  'E-mail Site': '5400',
  Eventos: '5400',
  Marketing: '5400',
  Parcerias: '5400',
  'Plataforma Site': '5400',
  'Premiação de vendas': '5400',

  // Despesas Tributárias (5500)
  GNRE: '5500',
  IPTU: '5500',
  IPVA: '5500',
  ISS: '5500',
  'Multas e Autos de Infrações': '5500',
  Protege: '5500',

  // Despesas Financeiras (6200)
  Aplicação: '6200',
  Empréstimos: '6200',
  'Tarifas Bancárias': '6200',
  'Taxa de Transação': '6200',

  // Receitas Financeiras (6100)
  Resgate: '6100',

  // ===============================================
  // Mapeamentos adicionais baseados na V2 atual
  // ===============================================

  // Administrativas → Despesas Administrativas (5200)
  Aluguel: '5200',
  Comunicação: '5200',
  'Contabilidade e Auditoria': '5200',
  'Gráfica e Impressões': '5200',
  'Recursos Humanos': '5100', // RH vai para Despesas com Pessoal
  'Registro de Marca': '5200',
  'Segurança Patrimonial': '5200',
  'Serviços de Limpeza': '5200',
  Tributos: '5500', // Tributos vai para Despesas Tributárias

  // Financeiras
  'Energia Elétrica': '5200',
  'Transportes e Fretes': '4000', // Custos Variáveis

  // Operacionais → Despesas Operacionais/CMV
  'Adesivo refletivo': '3000', // CMV - Material de produção
  'Ajustes e Reparos de Roupas': '3000', // CMV
  'Cabides e arara': '5300', // Operacional
  'Comissões de Venda': '4000', // Custos Variáveis
  'Desenvolvimento de Negócios': '5400', // Comercial
  'Entrada de Estoque': '3000', // CMV
  'Equipamentos operacionais': '5300', // Operacional
  'Equipamentos para Show Room': '5300', // Operacional
  Etiquetas: '3000', // CMV
  'Fitas de Presente': '3000', // CMV - Embalagens
  Fotos: '5400', // Comercial - Marketing
  Frete: '4000', // Custos Variáveis
  Manequim: '5300', // Operacional
  'Materiais de consumo': '5200', // Administrativo
  'Participação de Eventos': '5400', // Comercial
  'Private Label': '3000', // CMV - Produção
};

/**
 * Cria ContasDRE baseado no mapeamento V1 -> DRE
 * O campo nomeV1 em ContaDRE armazena o nome original da V1 para migração
 *
 * IMPORTANTE: Este mapeamento define como as classificações da V1 serão
 * convertidas para a estrutura DRE da V2. Você pode:
 * - Alterar o `nome` da ContaDRE para renomear na V2
 * - Manter `nomeV1` intacto para o mapeamento funcionar na migração
 *
 * @param parceiroId ID do parceiro
 */
async function criarContasDREComMapeamentoV1(parceiroId: number) {
  console.log(
    `\n🌱 Criando Contas DRE com mapeamento V1 (Parceiro ${parceiroId})...`,
  );

  let criadas = 0;
  let ordem = 100; // Começa após as contas padrão de receitas

  for (const [nomeV1, grupoCodigo] of Object.entries(mapeamentoV1ParaDRE)) {
    const grupo = await prisma.grupoDRE.findUnique({
      where: { codigo: grupoCodigo },
    });

    if (!grupo) {
      console.warn(`  ⚠ Grupo DRE não encontrado: ${grupoCodigo}`);
      continue;
    }

    // Criar ContaDRE com nomeV1 para mapeamento na migração
    // O `nome` pode ser editado depois para renomear na V2
    // O `nomeV1` deve permanecer para o mapeamento funcionar
    await prisma.contaDRE.upsert({
      where: {
        parceiroId_grupoId_nome: {
          parceiroId,
          grupoId: grupo.id,
          nome: nomeV1, // Por padrão, usa o mesmo nome
        },
      },
      update: {
        nomeV1, // Garante que nomeV1 está preenchido
      },
      create: {
        publicId: uuidv7(),
        grupoId: grupo.id,
        parceiroId,
        nome: nomeV1, // Nome atual (pode ser alterado depois)
        nomeV1, // Nome original da V1 (não alterar - usado na migração)
        ordem: ordem++,
      },
    });

    criadas++;
  }

  console.log(`✅ Contas DRE criadas com mapeamento V1: ${criadas}`);
}

/**
 * EXEMPLO: Como a migração real da V1 deve funcionar
 *
 * Esta função demonstra a lógica que o script de migração V1 -> V2 deve usar:
 *
 * 1. Ler despesa da V1 com seu ItensDespesas.descricao
 * 2. Buscar ContaDRE.nomeV1 = ItensDespesas.descricao
 * 3. Usar ContaDRE.id como contaDreId na despesa V2
 *
 * @param nomeClassificacaoV1 - Nome da classificação na V1 (ItensDespesas.descricao)
 * @param parceiroId - ID do parceiro
 * @returns contaDreId para usar na despesa V2, ou null se não encontrado
 */
async function buscarContaDrePorNomeV1(
  nomeClassificacaoV1: string,
  parceiroId: number,
): Promise<number | null> {
  const contaDre = await prisma.contaDRE.findFirst({
    where: {
      parceiroId,
      nomeV1: nomeClassificacaoV1,
    },
  });

  return contaDre?.id ?? null;
}

/**
 * Migra despesas existentes na V2 que já têm subcategoria
 * Útil para ambiente de desenvolvimento
 *
 * Para a migração real da V1, use buscarContaDrePorNomeV1()
 */
async function migrarDespesasParaContaDRE(parceiroId: number) {
  console.log(
    `\n🌱 Migrando Despesas para ContaDRE (Parceiro ${parceiroId})...`,
  );

  // Busca despesas sem contaDreId
  const todasDespesas = await prisma.despesa.findMany({
    where: {
      parceiroId,
      contaDreId: null,
    },
    include: {
      subCategoria: true,
    },
  });

  // Filtra apenas as que têm subcategoria
  const despesas = todasDespesas.filter(d => d.subCategoria !== null);

  let migradas = 0;
  let naoMapeadas = 0;

  for (const despesa of despesas) {
    if (!despesa.subCategoria) continue;

    // Usa a função de exemplo para buscar ContaDRE pelo nomeV1
    const contaDreId = await buscarContaDrePorNomeV1(
      despesa.subCategoria.descricao,
      parceiroId,
    );

    if (contaDreId) {
      await prisma.despesa.update({
        where: { id: despesa.id },
        data: { contaDreId },
      });
      migradas++;
    } else {
      console.warn(
        `    ⚠ Sem mapeamento para: "${despesa.subCategoria.descricao}"`,
      );
      naoMapeadas++;
    }
  }

  console.log(
    `✅ Despesas migradas: ${migradas}, sem mapeamento: ${naoMapeadas}`,
  );
}

/**
 * Cria contas DRE padrão para CMV/Custos (Parceiro específico)
 * Inclui a conta "Compra de Produtos" que é OBRIGATÓRIA para o processamento de pedidos de compra
 */
async function criarContasDREPadraoCustos(parceiroId: number) {
  console.log(
    `\n🌱 Criando Contas DRE padrão para custos (Parceiro ${parceiroId})...`,
  );

  // Grupo 3000 - Custos (CMV)
  const grupoCMV = await prisma.grupoDRE.findUnique({
    where: { codigo: '3000' },
  });

  if (!grupoCMV) {
    console.warn('  ⚠ Grupo de Custos CMV (3000) não encontrado');
    return;
  }

  const contasCusto = [
    // IMPORTANTE: "Compra de Produtos" é obrigatória para processamento de pedidos de compra
    { nome: 'Compra de Produtos', ordem: 1 },
  ];

  for (const conta of contasCusto) {
    await prisma.contaDRE.upsert({
      where: {
        parceiroId_grupoId_nome: {
          parceiroId,
          grupoId: grupoCMV.id,
          nome: conta.nome,
        },
      },
      update: {},
      create: {
        publicId: uuidv7(),
        grupoId: grupoCMV.id,
        parceiroId,
        nome: conta.nome,
        ordem: conta.ordem,
      },
    });
    console.log(`  ✓ ${conta.nome}`);
  }

  console.log('✅ Contas DRE de custos criadas com sucesso!');
}

/**
 * Cria contas DRE padrão para receitas (Parceiro específico)
 */
async function criarContasDREPadraoReceitas(parceiroId: number) {
  console.log(
    `\n🌱 Criando Contas DRE padrão para receitas (Parceiro ${parceiroId})...`,
  );

  // Grupo 1000 - Receitas de Vendas
  const grupoReceitas = await prisma.grupoDRE.findUnique({
    where: { codigo: '1000' },
  });

  if (!grupoReceitas) {
    console.warn('  ⚠ Grupo de Receitas (1000) não encontrado');
    return;
  }

  const contasReceita = [
    { nome: 'Venda de Produtos', ordem: 1 },
    { nome: 'Venda de Serviços', ordem: 2 },
    { nome: 'Brindes e Promoções', ordem: 3 },
    { nome: 'Permutas', ordem: 4 },
  ];

  for (const conta of contasReceita) {
    await prisma.contaDRE.upsert({
      where: {
        parceiroId_grupoId_nome: {
          parceiroId,
          grupoId: grupoReceitas.id,
          nome: conta.nome,
        },
      },
      update: {},
      create: {
        publicId: uuidv7(),
        grupoId: grupoReceitas.id,
        parceiroId,
        nome: conta.nome,
        ordem: conta.ordem,
      },
    });
    console.log(`  ✓ ${conta.nome}`);
  }

  // Grupo 2000 - Deduções
  const grupoDeducoes = await prisma.grupoDRE.findUnique({
    where: { codigo: '2000' },
  });

  if (grupoDeducoes) {
    const contasDeducao = [
      { nome: 'IVA sobre Vendas', ordem: 1 },
      { nome: 'Descontos Concedidos', ordem: 2 },
    ];

    for (const conta of contasDeducao) {
      await prisma.contaDRE.upsert({
        where: {
          parceiroId_grupoId_nome: {
            parceiroId,
            grupoId: grupoDeducoes.id,
            nome: conta.nome,
          },
        },
        update: {},
        create: {
          publicId: uuidv7(),
          grupoId: grupoDeducoes.id,
          parceiroId,
          nome: conta.nome,
          ordem: conta.ordem,
        },
      });
      console.log(`  ✓ ${conta.nome}`);
    }
  }

  console.log('✅ Contas DRE de receitas criadas com sucesso!');
}

// Função criarImpostosPadrao removida - tabela imposto não existe mais no schema

// Função criarRegrasLancamentoVendas removida - tabela regraLancamentoAutomatico não existe mais no schema

/**
 * Valida a migração
 */
async function validarMigracao(parceiroId: number) {
  console.log(`\n📊 Validando migração (Parceiro ${parceiroId})...`);

  const despesasSemConta = await prisma.despesa.count({
    where: { parceiroId, contaDreId: null },
  });

  const despesasComConta = await prisma.despesa.count({
    where: { parceiroId, contaDreId: { not: null } },
  });

  const totalDespesas = despesasSemConta + despesasComConta;

  console.log(`  - Total de despesas: ${totalDespesas}`);
  console.log(`  - Com contaDreId: ${despesasComConta}`);
  console.log(`  - Sem contaDreId: ${despesasSemConta}`);

  if (despesasSemConta > 0) {
    console.warn(`  ⚠ Existem ${despesasSemConta} despesas sem contaDreId`);
  } else {
    console.log('  ✓ Todas as despesas têm contaDreId');
  }

  const grupos = await prisma.grupoDRE.count();
  const contas = await prisma.contaDRE.count({ where: { parceiroId } });

  console.log(`\n📈 Resumo:`);
  console.log(`  - Grupos DRE: ${grupos}`);
  console.log(`  - Contas DRE: ${contas}`);
}

async function main() {
  const parceiroId = parseInt(process.env.SEED_PARCEIRO_ID ?? '1', 10);

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        SEED DRE - Plano de Contas                  ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`Parceiro ID: ${parceiroId}\n`);

  try {
    // 1. Criar grupos DRE padrão (globais)
    await seedGruposDRE();

    // 2. Criar contas DRE padrão para custos (inclui "Compra de Produtos" obrigatória)
    await criarContasDREPadraoCustos(parceiroId);

    // 3. Criar contas DRE padrão para receitas
    await criarContasDREPadraoReceitas(parceiroId);

    // 4. Criar contas DRE com mapeamento V1 (nomeV1)
    // =====================================================
    // IMPORTANTE: O campo nomeV1 em ContaDRE é usado na MIGRAÇÃO:
    //
    // - nomeV1 = nome da classificação na V1 (ItensDespesas.descricao)
    // - nome   = nome na V2 (pode ser diferente)
    //
    // Ao migrar despesas da V1 para V2:
    // 1. Busca ItensDespesas.descricao da despesa na V1
    // 2. Encontra ContaDRE onde nomeV1 = ItensDespesas.descricao
    // 3. Usa ContaDRE.id como contaDreId na despesa V2
    //
    // Você pode editar o mapeamento acima ou ajustar diretamente
    // no banco após o seed para corrigir classificações.
    // =====================================================
    await criarContasDREComMapeamentoV1(parceiroId);

    // 5. (Opcional) Migrar despesas existentes na V2 que já têm subcategoria
    // Isso é útil para ambiente de desenvolvimento onde já existem dados
    // Na migração real da V1, o script de migração usará ContaDRE.nomeV1
    const MIGRAR_DESPESAS_EXISTENTES = process.env.MIGRAR_DESPESAS === 'true';
    if (MIGRAR_DESPESAS_EXISTENTES) {
      await migrarDespesasParaContaDRE(parceiroId);
    } else {
      console.log(
        '\n⏭ Pulando migração de despesas (MIGRAR_DESPESAS !== true)',
      );
    }

    // 6. Validar migração
    await validarMigracao(parceiroId);

    console.log('\n✅ Seed DRE concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante seed DRE:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
