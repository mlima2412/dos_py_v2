# Plano de Implementação: Sistema DRE com Plano de Contas

## Resumo

Este documento descreve o plano de implementação para adicionar um sistema de Demonstração de Resultado do Exercício (DRE) ao DOSPY V2, incluindo:

- Nova estrutura de classificação: `GrupoDRE` → `ContaDRE`
- Lançamentos automáticos de receitas a partir de vendas
- Deduções automáticas (IVA) quando vendas têm fatura
- Sistema de regras parametrizável por parceiro

---

# BACKEND

## Fase 1: Nova Estrutura DRE (2-3 dias)

### 1.1 Alterações no Schema Prisma

**Arquivo:** `api/prisma/schema.prisma`

#### Novos Models:

```prisma
enum TipoDRE {
  RECEITA
  DEDUCAO
  CUSTO
  DESPESA
}

model GrupoDRE {
  id          Int        @id @default(autoincrement())
  publicId    String     @unique @map("public_id")
  codigo      String     @unique  // "1000", "2000", etc.
  nome        String
  tipo        TipoDRE
  ordem       Int
  ativo       Boolean    @default(true)
  createdAt   DateTime   @default(now()) @map("created_at")
  contas      ContaDRE[]

  @@map("grupo_dre")
}

model ContaDRE {
  id              Int                @id @default(autoincrement())
  publicId        String             @unique @map("public_id")
  grupoId         Int                @map("grupo_id")
  parceiroId      Int                @map("parceiro_id")
  codigo          String?
  nome            String
  ordem           Int
  ativo           Boolean            @default(true)
  createdAt       DateTime           @default(now()) @map("created_at")

  grupo           GrupoDRE           @relation(fields: [grupoId], references: [id])
  parceiro        Parceiro           @relation(fields: [parceiroId], references: [id])
  despesas        Despesa[]
  despesasRecorrentes DespesaRecorrente[]
  regrasLancamento RegraLancamentoAutomatico[]

  @@unique([parceiroId, grupoId, nome])
  @@map("conta_dre")
}

model RegraLancamentoAutomatico {
  id           Int      @id @default(autoincrement())
  publicId     String   @unique @map("public_id")
  contaDreId   Int      @map("conta_dre_id")
  parceiroId   Int      @map("parceiro_id")
  impostoId    Int?     @map("imposto_id")  // Referência ao imposto (para deduções)
  nome         String
  tipoGatilho  String   // "VENDA_CONFIRMADA", "VENDA_COM_FATURA", "VENDA_TIPO_*"
  tipoVenda    String?  // "DIRETA", "CONDICIONAL", "BRINDE", "PERMUTA" (filtro opcional)
  campoOrigem  String?  // "valorTotal", "valorFrete", "valorComissao"
  percentual   Decimal? @db.Decimal(5, 2)  // Sobrescreve percentual do imposto se informado
  ativo        Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")

  conta        ContaDRE @relation(fields: [contaDreId], references: [id])
  parceiro     Parceiro @relation(fields: [parceiroId], references: [id])
  imposto      Imposto? @relation(fields: [impostoId], references: [id])

  @@map("regra_lancamento_automatico")
}

// Tabela de Impostos parametrizável por parceiro
model Imposto {
  id           Int      @id @default(autoincrement())
  publicId     String   @unique @map("public_id")
  parceiroId   Int      @map("parceiro_id")
  nome         String   // "IVA", "ICMS", "PIS", "COFINS", etc.
  sigla        String   // "IVA", "ICMS"
  percentual   Decimal  @db.Decimal(5, 2)  // 10.00, 18.00, etc.
  ativo        Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")

  parceiro     Parceiro @relation(fields: [parceiroId], references: [id])
  regras       RegraLancamentoAutomatico[]

  @@unique([parceiroId, sigla])
  @@map("imposto")
}
```

#### Alterações em Models Existentes:

```prisma
// SubCategoriaDespesa - adicionar coluna temporária para migração
model SubCategoriaDespesa {
  // ... campos existentes ...
  nomeV1          String?   @map("nome_v1")     // Nome da classificação V1
  contaDreId      Int?      @map("conta_dre_id")
  contaDre        ContaDRE? @relation(fields: [contaDreId], references: [id])
}

// Despesa - adicionar relação com ContaDRE
model Despesa {
  // ... campos existentes ...
  contaDreId     Int?                @map("conta_dre_id")
  contaDre       ContaDRE?           @relation(fields: [contaDreId], references: [id])
}

// DespesaRecorrente - mesma alteração
model DespesaRecorrente {
  // ... campos existentes ...
  contaDreId     Int?                @map("conta_dre_id")
  contaDre       ContaDRE?           @relation(fields: [contaDreId], references: [id])
}

// Parceiro - adicionar relações
model Parceiro {
  // ... campos existentes ...
  ContaDRE                       ContaDRE[]
  RegraLancamentoAutomatico      RegraLancamentoAutomatico[]
}
```

### 1.2 Novos Módulos

```
api/src/
├── grupo-dre/
│   ├── grupo-dre.module.ts
│   ├── grupo-dre.controller.ts
│   ├── grupo-dre.service.ts
│   ├── dto/
│   │   ├── create-grupo-dre.dto.ts
│   │   └── grupo-dre-response.dto.ts
│   └── entities/
│       └── grupo-dre.entity.ts
│
├── conta-dre/
│   ├── conta-dre.module.ts
│   ├── conta-dre.controller.ts
│   ├── conta-dre.service.ts
│   ├── dto/
│   │   ├── create-conta-dre.dto.ts
│   │   └── update-conta-dre.dto.ts
│   └── entities/
│       └── conta-dre.entity.ts
│
└── regra-lancamento/
    ├── regra-lancamento.module.ts
    ├── regra-lancamento.controller.ts
    ├── regra-lancamento.service.ts
    └── dto/
```

### 1.3 Dados Seed - Grupos DRE Padrão

**Arquivo:** `api/prisma/seed.ts`

```typescript
const gruposDRE = [
  { codigo: '1000', nome: 'Receitas de Vendas', tipo: 'RECEITA', ordem: 1 },
  { codigo: '2000', nome: 'Deduções sobre Receita', tipo: 'DEDUCAO', ordem: 2 },
  { codigo: '3000', nome: 'Custos (CMV)', tipo: 'CUSTO', ordem: 3 },
  { codigo: '4000', nome: 'Custos Variáveis', tipo: 'CUSTO', ordem: 4 },
  { codigo: '5100', nome: 'Despesas com Pessoal', tipo: 'DESPESA', ordem: 5 },
  { codigo: '5200', nome: 'Despesas Administrativas', tipo: 'DESPESA', ordem: 6 },
  { codigo: '5300', nome: 'Despesas Operacionais', tipo: 'DESPESA', ordem: 7 },
  { codigo: '5400', nome: 'Despesas Comerciais', tipo: 'DESPESA', ordem: 8 },
  { codigo: '5500', nome: 'Despesas Tributárias', tipo: 'DESPESA', ordem: 9 },
  { codigo: '6100', nome: 'Receitas Financeiras', tipo: 'RECEITA', ordem: 10 },
  { codigo: '6200', nome: 'Despesas Financeiras', tipo: 'DESPESA', ordem: 11 },
];
```

### 1.4 Estratégia de Migração com Campo `nomeV1`

O campo `nomeV1` na tabela `SubCategoriaDespesa` será usado para mapear as subcategorias existentes (V1) para as novas contas DRE (V2).

**Fluxo de Migração:**

1. **Passo 1 - Migração Prisma:** Criar as novas tabelas (`grupo_dre`, `conta_dre`, etc.) e adicionar campos `nomeV1` e `contaDreId` em `SubCategoriaDespesa`

2. **Passo 2 - Preencher `nomeV1`:** Executar UPDATE para copiar o nome atual de cada subcategoria para `nomeV1`:
   ```sql
   UPDATE subcategoria_despesa SET nome_v1 = nome WHERE nome_v1 IS NULL;
   ```

3. **Passo 3 - Criar ContasDRE:** Para cada subcategoria, criar a ContaDRE correspondente baseado no mapeamento abaixo

4. **Passo 4 - Vincular:** Atualizar `contaDreId` em cada subcategoria apontando para a ContaDRE criada

5. **Passo 5 - Propagar para Despesas:** Atualizar `contaDreId` em todas as despesas baseado na subcategoria

**Mapeamento Natureza V1 → GrupoDRE:**

| Natureza V1 | Grupo DRE |
|-------------|-----------|
| CMV | 3000 - Custos (CMV) |
| Despesas Variáveis | 4000 - Custos Variáveis |
| Departamento Pessoal | 5100 - Despesas com Pessoal |
| Despesas administrativas | 5200 - Despesas Administrativas |
| Despesas Operacionais | 5300 - Despesas Operacionais |
| Despesas comerciais | 5400 - Despesas Comerciais |
| Despesas tributárias | 5500 - Despesas Tributárias |
| Despesas financeiras | 6200 - Despesas Financeiras |
| Receitas financeiras | 6100 - Receitas Financeiras |
| Receita Operacional | 1000 - Receitas de Vendas |
| Dedução sobre venda | 2000 - Deduções sobre Receita |

**Nota:** O campo `nomeV1` permite rastrear qual era o nome original da classificação V1, facilitando validação e eventual rollback se necessário.

### 1.5 Endpoints da API

```
GET    /grupo-dre                    # Listar todos os grupos
GET    /grupo-dre/:id                # Buscar grupo por ID
POST   /grupo-dre                    # Criar grupo (admin)

GET    /conta-dre                    # Listar contas do parceiro
GET    /conta-dre/grupo/:grupoId     # Listar contas por grupo
GET    /conta-dre/:id                # Buscar conta por ID
POST   /conta-dre                    # Criar conta
PUT    /conta-dre/:id                # Atualizar conta
DELETE /conta-dre/:id                # Desativar conta

GET    /regra-lancamento             # Listar regras do parceiro
POST   /regra-lancamento             # Criar regra
PUT    /regra-lancamento/:id         # Atualizar regra
DELETE /regra-lancamento/:id         # Desativar regra
```

---

## Fase 2: Lançamentos Automáticos (2-3 dias)

### 2.1 Serviço de Lançamentos Automáticos

**Arquivo:** `api/src/lancamento-automatico/lancamento-automatico.service.ts`

```typescript
@Injectable()
export class LancamentoAutomaticoService {
  async processarVendaConfirmada(venda: Venda, parceiroId: number): Promise<void> {
    // 1. Buscar regras ativas para VENDA_CONFIRMADA
    // 2. Para cada regra, criar lançamento (receita)
    // 3. Se venda tem fatura, processar VENDA_COM_FATURA (IVA)
  }

  async processarVendaComFatura(venda: Venda, parceiroId: number): Promise<void> {
    // 1. Buscar regras para VENDA_COM_FATURA
    // 2. Calcular valor (percentual sobre valorTotal)
    // 3. Criar despesa de dedução (IVA)
  }

  async processarDespesaCriada(despesa: Despesa, parceiroId: number): Promise<void> {
    // Preencher contaDreId baseado na subcategoria
  }
}
```

### 2.2 Integração com VendaService

**Arquivo:** `api/src/venda/venda.service.ts`

Adicionar após confirmação de venda (em `finalizarDireta`, `finalizarCondicional`, `finalizarBrindePermuta`):

```typescript
await this.lancamentoAutomaticoService.processarVendaConfirmada(
  vendaFinalizada,
  parceiroId
);
```

### 2.3 Integração com DespesasService

**Arquivo:** `api/src/despesas/despesas.service.ts`

Adicionar no final de `create()`:

```typescript
await this.lancamentoAutomaticoService.processarDespesaCriada(
  createdDespesa,
  parceiroId
);
```

### 2.4 Tabela de Impostos (Seed por Parceiro)

```typescript
// Exemplo para parceiro no Paraguai
const impostosParaguai = [
  { sigla: 'IVA', nome: 'Impuesto al Valor Agregado', percentual: 10 },
];

// Exemplo para parceiro no Brasil
const impostosBrasil = [
  { sigla: 'ICMS', nome: 'Imposto sobre Circulação de Mercadorias', percentual: 18 },
  { sigla: 'PIS', nome: 'Programa de Integração Social', percentual: 1.65 },
  { sigla: 'COFINS', nome: 'Contribuição para Financiamento da Seguridade Social', percentual: 7.6 },
];
```

### 2.5 Regras de Lançamento Padrão

| Nome | Tipo Gatilho | Tipo Venda | Campo | Imposto | Conta DRE |
|------|--------------|------------|-------|---------|-----------|
| Receita Venda Direta | VENDA_CONFIRMADA | DIRETA | valorTotal | - | Venda de produtos |
| Receita Venda Condicional | VENDA_CONFIRMADA | CONDICIONAL | valorTotal | - | Venda de produtos |
| Receita Brinde | VENDA_CONFIRMADA | BRINDE | valorTotal | - | Brindes e Promoções |
| Receita Permuta | VENDA_CONFIRMADA | PERMUTA | valorTotal | - | Permutas |
| IVA sobre Vendas | VENDA_COM_FATURA | - | valorTotal | IVA | IVA sobre Vendas |
| Comissão de Venda | VENDA_CONFIRMADA | - | valorComissao | - | Comissão sobre vendas |
| Frete de Entrega | VENDA_CONFIRMADA | - | valorFrete | - | Fretes de entregas |

**Nota:** O percentual do imposto é obtido da tabela `Imposto`. Se a regra tiver `percentual` definido, ele sobrescreve o valor do imposto (útil para casos especiais).

### 2.5 Alterações no Cache Redis

**Novas chaves (coexistir com antigas):**

```
app:dospy:{parceiroId}:dre:sum:month:{ym}:by:conta
app:dospy:{parceiroId}:dre:sum:month:{ym}:by:grupo
app:dospy:{parceiroId}:dre:sum:year:{yyyy}:by:conta
app:dospy:{parceiroId}:dre:sum:year:{yyyy}:by:grupo
app:dospy:dict:conta
app:dospy:dict:grupo
```

---

## Fase 3: Migração de Dados (1-2 dias)

### 3.1 Script de Migração

**Arquivo:** `api/prisma/migrate-to-dre.ts`

```typescript
async function main() {
  // 1. Criar grupos DRE
  await seedGruposDRE(prisma);

  // 2. Para cada subcategoria:
  //    - Buscar mapeamento pelo nome (nomeV1)
  //    - Criar ContaDRE correspondente
  //    - Atualizar subcategoria.contaDreId
  await migrarSubCategoriasParaContaDRE(prisma, parceiroId);

  // 3. Atualizar todas as despesas com contaDreId
  await prisma.$executeRaw`
    UPDATE despesa d
    SET conta_dre_id = s.conta_dre_id
    FROM subcategoria_despesa s
    WHERE d.sub_categoria_id = s.subcategoria_id
    AND s.conta_dre_id IS NOT NULL
  `;

  // 4. Criar regras de lançamento padrão
  await seedRegrasLancamento(prisma, parceiroId);

  // 5. Validar migração
  await validarMigracao(prisma, parceiroId);
}
```

### 3.2 Validação

```typescript
async function validarMigracao(prisma: PrismaClient, parceiroId: number) {
  // 1. Verificar despesas sem contaDreId
  const despesasSemConta = await prisma.despesa.count({
    where: { parceiroId, contaDreId: null }
  });

  // 2. Comparar totais
  const totalOriginal = await prisma.despesa.aggregate({
    where: { parceiroId },
    _sum: { valorTotal: true }
  });

  const totalMigrado = await prisma.despesa.aggregate({
    where: { parceiroId, contaDreId: { not: null } },
    _sum: { valorTotal: true }
  });

  console.log(`Despesas sem conta: ${despesasSemConta}`);
  console.log(`Total original: ${totalOriginal._sum.valorTotal}`);
  console.log(`Total migrado: ${totalMigrado._sum.valorTotal}`);
}
```

### 3.3 Ordem de Execução

```bash
# 1. Migration Prisma
npx prisma migrate dev --name add_dre_structure

# 2. Script de migração
npx ts-node prisma/migrate-to-dre.ts

# 3. Regenerar API client
cd ../admin && npm run generate:api
```

---

# FRONTEND

## Fase 1: Novos Componentes DRE (2-3 dias)

### 1.1 Estrutura de Páginas

```
admin/src/pages/
├── dre/
│   ├── index.ts
│   ├── DREPage.tsx              # Dashboard DRE
│   ├── PlanoContas.tsx          # Gestão de grupos/contas
│   ├── RegrasLancamento.tsx     # Gestão de regras
│   └── components/
│       ├── DRETable.tsx         # Tabela formato DRE
│       ├── DREBarChart.tsx      # Gráfico de barras
│       ├── DREPieChart.tsx      # Gráfico de pizza
│       ├── GrupoDRECard.tsx     # Card de grupo
│       └── ContaDREForm.tsx     # Formulário de conta
```

### 1.2 Componente DRETable

```tsx
<Table>
  <TableBody>
    {/* RECEITA BRUTA */}
    <TableRow className="bg-green-50 font-bold">
      <TableCell>(=) RECEITA BRUTA</TableCell>
      <TableCell className="text-right">{formatCurrency(receitaBruta)}</TableCell>
      <TableCell className="text-right">100%</TableCell>
    </TableRow>
    {/* Contas de receita */}

    {/* DEDUÇÕES */}
    <TableRow className="bg-red-50 font-bold">
      <TableCell>(-) DEDUÇÕES</TableCell>
      <TableCell className="text-right text-red-600">({formatCurrency(deducoes)})</TableCell>
      <TableCell className="text-right">{percentualDeducoes}%</TableCell>
    </TableRow>

    {/* RECEITA LÍQUIDA */}
    <TableRow className="bg-blue-100 font-bold">
      <TableCell>(=) RECEITA LÍQUIDA</TableCell>
      <TableCell className="text-right">{formatCurrency(receitaLiquida)}</TableCell>
      <TableCell className="text-right">{percentualReceitaLiquida}%</TableCell>
    </TableRow>

    {/* CUSTOS */}
    {/* DESPESAS */}

    {/* RESULTADO */}
    <TableRow className="font-bold text-lg bg-green-100">
      <TableCell>(=) RESULTADO</TableCell>
      <TableCell className="text-right">{formatCurrency(resultado)}</TableCell>
      <TableCell className="text-right">{percentualResultado}%</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 1.3 Hooks de API

```typescript
// admin/src/hooks/useDRE.ts
export function useGruposDRE() {
  return useGrupoDreControllerFindAll();
}

export function useContasDRE(grupoId?: number, parceiroId?: string) {
  return useContaDreControllerFindByGrupo(grupoId, { parceiroId });
}

export function useRegrasLancamento(parceiroId: string) {
  return useRegraLancamentoControllerFindAll({ parceiroId });
}

export function useDRESummary(parceiroId: string, year: number, month?: number) {
  return useDreControllerGetResumo(parceiroId, year, month);
}
```

---

## Fase 2: Adaptação de Formulários (1-2 dias)

### 2.1 FormularioDespesa

**Arquivo:** `admin/src/pages/despesas/correntes/FormularioDespesa.tsx`

**Mudanças:**
1. Substituir `categoriaId` → `grupoId`
2. Substituir `subCategoriaId` → `contaDreId`
3. Filtrar grupos por tipo (DESPESA, CUSTO)

```tsx
// Antes
<FormField name="categoriaId" ... />
<FormField name="subCategoriaId" ... />

// Depois
<FormField
  name="grupoId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('expenses.group')}</FormLabel>
      <Select onValueChange={field.onChange} value={field.value?.toString()}>
        {grupos?.filter(g => g.tipo === 'DESPESA' || g.tipo === 'CUSTO')
          .map(g => (
            <SelectItem key={g.id} value={g.id.toString()}>
              {g.nome}
            </SelectItem>
          ))}
      </Select>
    </FormItem>
  )}
/>

<FormField
  name="contaDreId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('expenses.account')}</FormLabel>
      <Combobox
        options={contas?.map(c => ({ value: c.id.toString(), label: c.nome }))}
        value={field.value?.toString()}
        onChange={field.onChange}
        disabled={!grupoId}
      />
    </FormItem>
  )}
/>
```

### 2.2 FormularioDespesaRecorrente

**Arquivo:** `admin/src/pages/despesas/recorrentes/FormularioDespesaRecorrente.tsx`

Mesmas alterações do FormularioDespesa.

---

## Fase 3: Dashboard e Relatórios (1-2 dias)

### 3.1 Dashboard de Despesas

**Arquivo:** `admin/src/pages/despesas/Dashboard.tsx`

Adicionar seção com resumo DRE:

```tsx
<Card>
  <CardHeader>
    <CardTitle>{t('dre.overview')}</CardTitle>
  </CardHeader>
  <CardContent>
    <DREResumo year={selectedYear} month={selectedMonth} />
  </CardContent>
</Card>
```

### 3.2 Gráficos

**CategoryPieChart** e **ClassificationPieChart**:
- Adaptar para usar grupos/contas DRE ao invés de categorias/subcategorias

### 3.3 Relatórios

**RelatoriosDespesas.tsx**:
- Adicionar opção de relatório em formato DRE

---

## Fase 4: Menu e Navegação (0.5 dia)

### 4.1 Menu - Dentro da Seção Finanças

**Arquivo:** `admin/src/components/layout/menu-list.ts`

As novas páginas de DRE devem ser adicionadas como sub-itens dentro da seção **Finanças** existente (não criar seção separada):

```typescript
// Dentro do groupLabel: 'menu.finances' (Finanças)
{
  groupLabel: 'menu.finances',
  menus: [
    // ... itens existentes (Despesas, Contas a Pagar, etc.)

    // Novos itens DRE:
    {
      href: '/financas/dre',
      label: 'menu.finances.dre',
      icon: BarChart3,
    },
    {
      href: '/financas/plano-contas',
      label: 'menu.finances.chartOfAccounts',
      icon: List,
    },
    {
      href: '/financas/regras-lancamento',
      label: 'menu.finances.autoRules',
      icon: Settings2,
    },
  ],
},
```

### 4.2 Rotas

**Arquivo:** `admin/src/App.tsx` ou arquivo de rotas

```tsx
<Route path="/financas/dre" element={<DREPage />} />
<Route path="/financas/plano-contas" element={<PlanoContas />} />
<Route path="/financas/regras-lancamento" element={<RegrasLancamento />} />
```

---

## Fase 5: Traduções (0.5 dia)

### 5.1 Português

**Arquivo:** `admin/src/i18n/locales/pt/common.json`

```json
{
  "menu": {
    "finances": {
      "dre": "DRE",
      "chartOfAccounts": "Plano de Contas",
      "autoRules": "Regras de Lançamento"
    }
  },
  "dre": {
    "title": "Demonstração do Resultado",
    "grossRevenue": "Receita Bruta",
    "deductions": "Deduções",
    "netRevenue": "Receita Líquida",
    "costs": "Custos",
    "grossProfit": "Lucro Bruto",
    "expenses": "Despesas Operacionais",
    "operatingResult": "Resultado Operacional",
    "netResult": "Resultado Líquido",
    "groups": {
      "title": "Grupos DRE",
      "add": "Novo Grupo"
    },
    "accounts": {
      "title": "Contas DRE",
      "add": "Nova Conta"
    },
    "rules": {
      "title": "Regras de Lançamento Automático",
      "add": "Nova Regra",
      "trigger": {
        "VENDA_CONFIRMADA": "Venda Confirmada",
        "VENDA_COM_FATURA": "Venda com Fatura"
      }
    }
  },
  "expenses": {
    "group": "Grupo DRE",
    "account": "Conta DRE"
  }
}
```

### 5.2 Espanhol

**Arquivo:** `admin/src/i18n/locales/es/common.json`

```json
{
  "menu": {
    "finances": {
      "dre": "Estado de Resultados",
      "chartOfAccounts": "Plan de Cuentas",
      "autoRules": "Reglas de Lanzamiento"
    }
  },
  "dre": {
    "title": "Estado de Resultados",
    "grossRevenue": "Ingresos Brutos",
    "deductions": "Deducciones",
    "netRevenue": "Ingresos Netos",
    "costs": "Costos",
    "grossProfit": "Utilidad Bruta",
    "expenses": "Gastos Operacionales",
    "operatingResult": "Resultado Operacional",
    "netResult": "Resultado Neto"
  }
}
```

---

# CRONOGRAMA RESUMIDO

| Fase | Backend | Frontend | Total |
|------|---------|----------|-------|
| 1. Nova Estrutura DRE | 2-3 dias | - | 2-3 dias |
| 2. Lançamentos Automáticos | 2-3 dias | - | 2-3 dias |
| 3. Novos Componentes | - | 2-3 dias | 2-3 dias |
| 4. Adaptação Formulários | - | 1-2 dias | 1-2 dias |
| 5. Dashboard/Relatórios | - | 1-2 dias | 1-2 dias |
| 6. Menu/Traduções | - | 1 dia | 1 dia |
| 7. Migração de Dados | 1-2 dias | - | 1-2 dias |
| **TOTAL** | **5-8 dias** | **5-8 dias** | **10-16 dias** |

---

# CHECKLIST DE VALIDAÇÃO

## Backend
- [ ] Tabelas `grupo_dre`, `conta_dre`, `regra_lancamento_automatico` criadas
- [ ] APIs CRUD funcionando
- [ ] Swagger atualizado
- [ ] Lançamentos automáticos de receita funcionando
- [ ] Lançamentos de IVA quando venda tem fatura
- [ ] Cache Redis atualizado

## Frontend
- [ ] Formulário de despesa usando Grupo/Conta DRE
- [ ] Dashboard com visão DRE
- [ ] Página de DRE completa
- [ ] Gestão de regras funcionando
- [ ] Traduções PT/ES completas

## Migração
- [ ] Todas as despesas com `contaDreId` preenchido
- [ ] Totais conferem (antes vs depois)
- [ ] Relatório DRE mostrando dados históricos
