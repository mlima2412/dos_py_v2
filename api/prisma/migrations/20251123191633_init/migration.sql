-- CreateEnum
CREATE TYPE "public"."Linguagem" AS ENUM ('Español', 'Portugues');

-- CreateEnum
CREATE TYPE "public"."TipoPagamento" AS ENUM ('A_VISTA_IMEDIATA', 'A_PRAZO_SEM_PARCELAS', 'PARCELADO');

-- CreateEnum
CREATE TYPE "public"."FrequenciaEnum" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."TipoMovimento" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'CONDICIONAL', 'DEVOLUCAO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "public"."VendaTipo" AS ENUM ('DIRETA', 'CONDICIONAL', 'BRINDE', 'PERMUTA');

-- CreateEnum
CREATE TYPE "public"."VendaStatus" AS ENUM ('PEDIDO', 'ABERTA', 'CONFIRMADA', 'CONFIRMADA_PARCIAL', 'CONFIRMADA_TOTAL', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."VendaItemTipo" AS ENUM ('NORMAL', 'CONDICIONAL', 'BRINDE', 'PERMUTA');

-- CreateEnum
CREATE TYPE "public"."DescontoTipo" AS ENUM ('VALOR', 'PERCENTUAL');

-- CreateEnum
CREATE TYPE "public"."TipoVenda" AS ENUM ('A_VISTA_IMEDIATA', 'A_PRAZO_SEM_PARCELAS', 'PARCELADO', 'PARCELADO_FLEXIVEL');

-- CreateEnum
CREATE TYPE "public"."ParcelaStatus" AS ENUM ('PENDENTE', 'PAGO', 'PAGO_ATRASADO');

-- CreateTable
CREATE TABLE "public"."perfil" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuario" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'LOCAL',
    "google_id" TEXT,
    "senha" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_reset_token" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fornecedor" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ruccnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "redesocial" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_compra" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parceiro_id" INTEGER NOT NULL,

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuario_parceiro" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_parceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parceiro" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ruccnpj" TEXT,
    "email" TEXT NOT NULL,
    "rede_social" TEXT,
    "telefone" TEXT,
    "currency_id" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "logo_url" TEXT,
    "thumb_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."canal_origem" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canal_origem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cliente" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "rede_social" TEXT,
    "celular" TEXT,
    "ruccnpj" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "cep" TEXT,
    "observacoes" TEXT,
    "linguagem" "public"."Linguagem" NOT NULL DEFAULT 'Español',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_compra" TIMESTAMP(3),
    "qtd_compras" INTEGER NOT NULL DEFAULT 0,
    "parceiro_id" INTEGER NOT NULL,
    "canal_origem_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currency" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "prefixo" TEXT NOT NULL,
    "iso_code" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 2,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "default_rate" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categoria_despesas" (
    "categoria_id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categoria_despesas_pkey" PRIMARY KEY ("categoria_id")
);

-- CreateTable
CREATE TABLE "public"."subcategoria_despesa" (
    "subcategoria_id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcategoria_despesa_pkey" PRIMARY KEY ("subcategoria_id")
);

-- CreateTable
CREATE TABLE "public"."despesa" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "data_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "descricao" TEXT NOT NULL,
    "tipo_pagamento" "public"."TipoPagamento" NOT NULL DEFAULT 'A_VISTA_IMEDIATA',
    "sub_categoria_id" INTEGER NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER,
    "currency_id" INTEGER,
    "cotacao" DECIMAL(12,3) DEFAULT 0.0,

    CONSTRAINT "despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."despesa_recorrente" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "frequencia" "public"."FrequenciaEnum" NOT NULL DEFAULT 'MENSAL',
    "dia_vencimento" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "sub_categoria_id" INTEGER NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER,
    "currency_id" INTEGER,
    "cotacao" DECIMAL(12,3) DEFAULT 0.0,

    CONSTRAINT "despesa_recorrente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contas_a_pagar" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "despesa_id" INTEGER,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_pagamento" TIMESTAMP(3),
    "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "saldo" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "pago" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "contas_a_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contas_a_pagar_parcelas" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "currency_id" INTEGER,
    "contas_pagar_id" INTEGER NOT NULL,

    CONSTRAINT "contas_a_pagar_parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rollup_despesas_mensais" (
    "parceiro_id" INTEGER NOT NULL,
    "ym" TEXT NOT NULL,
    "realized" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "to_pay" DECIMAL(12,3) NOT NULL DEFAULT 0.0,

    CONSTRAINT "rollup_despesas_mensais_pkey" PRIMARY KEY ("parceiro_id","ym")
);

-- CreateTable
CREATE TABLE "public"."rollup_despesas_mensais_categoria" (
    "parceiro_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "sub_categoria_id" INTEGER NOT NULL,
    "ym" TEXT NOT NULL,
    "realized" DECIMAL(12,3) NOT NULL DEFAULT 0.0,

    CONSTRAINT "rollup_despesas_mensais_categoria_pkey" PRIMARY KEY ("parceiro_id","ym","categoria_id","sub_categoria_id")
);

-- CreateTable
CREATE TABLE "public"."rollup_vendas_mensais" (
    "parceiro_id" INTEGER NOT NULL,
    "ym" TEXT NOT NULL,
    "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "desconto_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "desconto_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rollup_vendas_mensais_pkey" PRIMARY KEY ("parceiro_id","ym")
);

-- CreateTable
CREATE TABLE "public"."rollup_vendas_mensais_tipo" (
    "parceiro_id" INTEGER NOT NULL,
    "ym" TEXT NOT NULL,
    "tipo" "public"."VendaTipo" NOT NULL,
    "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "quantidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rollup_vendas_mensais_tipo_pkey" PRIMARY KEY ("parceiro_id","ym","tipo")
);

-- CreateTable
CREATE TABLE "public"."categoria_produto" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "categoria_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produto" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "consignado" BOOLEAN NOT NULL DEFAULT false,
    "categoria_id" INTEGER,
    "descricao" TEXT,
    "img_url" TEXT,
    "preco_compra" DECIMAL(12,3) DEFAULT 0.0,
    "currency_id" INTEGER,
    "preco_venda" DECIMAL(12,3) NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produto_sku" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "cor" TEXT,
    "cod_cor" TEXT,
    "tamanho" TEXT,
    "qtd_minima" INTEGER NOT NULL DEFAULT 0,
    "data_ultima_compra" TIMESTAMP(3),

    CONSTRAINT "produto_sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produto_historico_preco" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "preco" DECIMAL(12,3) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produto_historico_preco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."local_estoque" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,

    CONSTRAINT "local_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estoque_sku" (
    "sku_id" INTEGER NOT NULL,
    "local_id" INTEGER NOT NULL,
    "qtd" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estoque_sku_pkey" PRIMARY KEY ("local_id","sku_id")
);

-- CreateTable
CREATE TABLE "public"."movimento_estoque" (
    "id" SERIAL NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "tipo" "public"."TipoMovimento" NOT NULL DEFAULT 'ENTRADA',
    "qtd" INTEGER NOT NULL DEFAULT 1,
    "id_usuario" INTEGER NOT NULL,
    "data_movimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "local_origem_id" INTEGER,
    "local_destino_id" INTEGER,
    "observacao" TEXT,
    "pedidoCompraId" INTEGER,

    CONSTRAINT "movimento_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transferencia_estoque" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "local_origem_id" INTEGER NOT NULL,
    "local_destino_id" INTEGER NOT NULL,
    "enviado_por_usuario_id" INTEGER NOT NULL,
    "recebido_por_usuario_id" INTEGER,
    "qtd" INTEGER NOT NULL DEFAULT 1,
    "valor_total" DECIMAL(12,3) NOT NULL DEFAULT 0.0,
    "data_transferencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_recebimento" TIMESTAMP(3),

    CONSTRAINT "transferencia_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transferencia_estoque_item" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "movimento_estoque_id" INTEGER NOT NULL,

    CONSTRAINT "transferencia_estoque_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conferencia_estoque" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "local_estoque_id" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "usuario_responsavel_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "conferencia_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conferencia_item" (
    "id" SERIAL NOT NULL,
    "conferencia_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "qtd_sistema" INTEGER NOT NULL DEFAULT 0,
    "qtd_conferencia" INTEGER NOT NULL DEFAULT 0,
    "diferenca" INTEGER NOT NULL DEFAULT 0,
    "ajustado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conferencia_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forma_pagamento" (
    "idFormaPag" SERIAL NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "taxa" DECIMAL(12,3) DEFAULT 0,
    "tempo_liberacao" INTEGER NOT NULL DEFAULT 0,
    "imposto_pos_calculo" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "forma_pagamento_pkey" PRIMARY KEY ("idFormaPag")
);

-- CreateTable
CREATE TABLE "public"."pedido_compra" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "local_entrada_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_entrega" TIMESTAMP(3),
    "valor_frete" DECIMAL(12,3) DEFAULT 0,
    "valor_total" DECIMAL(12,3) DEFAULT 0,
    "observacao" TEXT,
    "valor_comissao" DECIMAL(12,3) DEFAULT 0,
    "cotacao" DOUBLE PRECISION DEFAULT 1,
    "currency_id" INTEGER,
    "consignado" BOOLEAN NOT NULL DEFAULT false,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pedido_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pedido_compra_item" (
    "id" SERIAL NOT NULL,
    "pedido_compra_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "qtd" INTEGER NOT NULL,
    "preco_compra" DECIMAL(12,3) NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "pedido_compra_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pagamento" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "forma_pagamento_id" INTEGER NOT NULL,
    "tipo" "public"."TipoVenda" NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "valor_delivery" DECIMAL(12,3),
    "entrada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parcelamento" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "valor_pago" DOUBLE PRECISION NOT NULL,
    "situacao" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "parcelamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parcelas" (
    "id" SERIAL NOT NULL,
    "parcelamento_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "vencimento" TIMESTAMP(3),
    "recebido_em" TIMESTAMP(3),
    "status" "public"."ParcelaStatus" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."venda" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "idv1" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
    "local_saida_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "tipo" "public"."VendaTipo" NOT NULL DEFAULT 'DIRETA',
    "status" "public"."VendaStatus" NOT NULL DEFAULT 'PEDIDO',
    "data_venda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_entrega" TIMESTAMP(3),
    "valor_frete" DECIMAL(12,3) DEFAULT 0,
    "valor_total" DECIMAL(12,3) DEFAULT 0,
    "desconto" DECIMAL(12,3) DEFAULT 0,
    "ruccnpj" TEXT,
    "nome_fatura" TEXT,
    "numero_fatura" TEXT,
    "observacao" TEXT,
    "valor_comissao" DECIMAL(12,3) DEFAULT 0,
    "parcelamento_id" INTEGER,

    CONSTRAINT "venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."venda_item" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "tipo" "public"."VendaItemTipo" NOT NULL DEFAULT 'NORMAL',
    "qtd_reservada" INTEGER NOT NULL,
    "qtd_aceita" INTEGER NOT NULL DEFAULT 0,
    "qtd_devolvida" INTEGER NOT NULL DEFAULT 0,
    "desconto" DECIMAL(12,3) DEFAULT 0,
    "desconto_tipo" "public"."DescontoTipo" DEFAULT 'VALOR',
    "desconto_valor" DECIMAL(12,3) DEFAULT 0,
    "preco_unit" DECIMAL(12,3) NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "venda_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_public_id_key" ON "public"."usuario"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "public"."usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_key" ON "public"."password_reset_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_public_id_key" ON "public"."fornecedor"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_ruccnpj_key" ON "public"."fornecedor"("ruccnpj");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_email_key" ON "public"."fornecedor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parceiro_public_id_key" ON "public"."parceiro"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "parceiro_ruccnpj_key" ON "public"."parceiro"("ruccnpj");

-- CreateIndex
CREATE UNIQUE INDEX "parceiro_email_key" ON "public"."parceiro"("email");

-- CreateIndex
CREATE UNIQUE INDEX "canal_origem_public_id_key" ON "public"."canal_origem"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_public_id_key" ON "public"."cliente"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_ruccnpj_key" ON "public"."cliente"("ruccnpj");

-- CreateIndex
CREATE UNIQUE INDEX "currency_public_id_key" ON "public"."currency"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "currency_iso_code_key" ON "public"."currency"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "despesa_public_id_key" ON "public"."despesa"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "despesa_recorrente_public_id_key" ON "public"."despesa_recorrente"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "contas_a_pagar_public_id_key" ON "public"."contas_a_pagar"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "contas_a_pagar_parcelas_public_id_key" ON "public"."contas_a_pagar_parcelas"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "produto_public_id_key" ON "public"."produto"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "produto_sku_public_id_key" ON "public"."produto_sku"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "local_estoque_public_id_key" ON "public"."local_estoque"("public_id");

-- CreateIndex
CREATE INDEX "local_estoque_parceiro_id_idx" ON "public"."local_estoque"("parceiro_id");

-- CreateIndex
CREATE INDEX "movimento_estoque_sku_id_idx" ON "public"."movimento_estoque"("sku_id");

-- CreateIndex
CREATE INDEX "movimento_estoque_local_origem_id_idx" ON "public"."movimento_estoque"("local_origem_id");

-- CreateIndex
CREATE INDEX "movimento_estoque_local_destino_id_idx" ON "public"."movimento_estoque"("local_destino_id");

-- CreateIndex
CREATE UNIQUE INDEX "transferencia_estoque_public_id_key" ON "public"."transferencia_estoque"("public_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_local_origem_id_idx" ON "public"."transferencia_estoque"("local_origem_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_local_destino_id_idx" ON "public"."transferencia_estoque"("local_destino_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_enviado_por_usuario_id_idx" ON "public"."transferencia_estoque"("enviado_por_usuario_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_recebido_por_usuario_id_idx" ON "public"."transferencia_estoque"("recebido_por_usuario_id");

-- CreateIndex
CREATE INDEX "transferencia_estoque_item_transferencia_id_idx" ON "public"."transferencia_estoque_item"("transferencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "conferencia_estoque_public_id_key" ON "public"."conferencia_estoque"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedido_compra_public_id_key" ON "public"."pedido_compra"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "venda_public_id_key" ON "public"."venda"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "venda_idv1_key" ON "public"."venda"("idv1");

-- CreateIndex
CREATE INDEX "venda_parceiro_id_cliente_id_idx" ON "public"."venda"("parceiro_id", "cliente_id");

-- AddForeignKey
ALTER TABLE "public"."password_reset_token" ADD CONSTRAINT "password_reset_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fornecedor" ADD CONSTRAINT "fornecedor_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_parceiro" ADD CONSTRAINT "usuario_parceiro_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_parceiro" ADD CONSTRAINT "usuario_parceiro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_parceiro" ADD CONSTRAINT "usuario_parceiro_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parceiro" ADD CONSTRAINT "parceiro_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cliente" ADD CONSTRAINT "cliente_canal_origem_id_fkey" FOREIGN KEY ("canal_origem_id") REFERENCES "public"."canal_origem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cliente" ADD CONSTRAINT "cliente_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subcategoria_despesa" ADD CONSTRAINT "subcategoria_despesa_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria_despesas"("categoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa" ADD CONSTRAINT "despesa_sub_categoria_id_fkey" FOREIGN KEY ("sub_categoria_id") REFERENCES "public"."subcategoria_despesa"("subcategoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesa_recorrente" ADD CONSTRAINT "despesa_recorrente_sub_categoria_id_fkey" FOREIGN KEY ("sub_categoria_id") REFERENCES "public"."subcategoria_despesa"("subcategoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar" ADD CONSTRAINT "contas_a_pagar_despesa_id_fkey" FOREIGN KEY ("despesa_id") REFERENCES "public"."despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" ADD CONSTRAINT "contas_a_pagar_parcelas_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_a_pagar_parcelas" ADD CONSTRAINT "contas_a_pagar_parcelas_contas_pagar_id_fkey" FOREIGN KEY ("contas_pagar_id") REFERENCES "public"."contas_a_pagar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais" ADD CONSTRAINT "rollup_despesas_mensais_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria_despesas"("categoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_despesas_mensais_categoria" ADD CONSTRAINT "rollup_despesas_mensais_categoria_sub_categoria_id_fkey" FOREIGN KEY ("sub_categoria_id") REFERENCES "public"."subcategoria_despesa"("subcategoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_vendas_mensais" ADD CONSTRAINT "rollup_vendas_mensais_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rollup_vendas_mensais_tipo" ADD CONSTRAINT "rollup_vendas_mensais_tipo_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produto" ADD CONSTRAINT "produto_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produto" ADD CONSTRAINT "produto_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produto" ADD CONSTRAINT "produto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produto" ADD CONSTRAINT "produto_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produto_sku" ADD CONSTRAINT "produto_sku_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produto_historico_preco" ADD CONSTRAINT "produto_historico_preco_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."local_estoque" ADD CONSTRAINT "local_estoque_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estoque_sku" ADD CONSTRAINT "estoque_sku_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estoque_sku" ADD CONSTRAINT "estoque_sku_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_local_origem_id_fkey" FOREIGN KEY ("local_origem_id") REFERENCES "public"."local_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_local_destino_id_fkey" FOREIGN KEY ("local_destino_id") REFERENCES "public"."local_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimento_estoque" ADD CONSTRAINT "movimento_estoque_pedidoCompraId_fkey" FOREIGN KEY ("pedidoCompraId") REFERENCES "public"."pedido_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_enviado_por_usuario_id_fkey" FOREIGN KEY ("enviado_por_usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_recebido_por_usuario_id_fkey" FOREIGN KEY ("recebido_por_usuario_id") REFERENCES "public"."usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_local_origem_id_fkey" FOREIGN KEY ("local_origem_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_local_destino_id_fkey" FOREIGN KEY ("local_destino_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque_item" ADD CONSTRAINT "transferencia_estoque_item_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "public"."transferencia_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencia_estoque_item" ADD CONSTRAINT "transferencia_estoque_item_movimento_estoque_id_fkey" FOREIGN KEY ("movimento_estoque_id") REFERENCES "public"."movimento_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_estoque" ADD CONSTRAINT "conferencia_estoque_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_estoque" ADD CONSTRAINT "conferencia_estoque_usuario_responsavel_id_fkey" FOREIGN KEY ("usuario_responsavel_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_estoque" ADD CONSTRAINT "conferencia_estoque_local_estoque_id_fkey" FOREIGN KEY ("local_estoque_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_item" ADD CONSTRAINT "conferencia_item_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conferencia_item" ADD CONSTRAINT "conferencia_item_conferencia_id_fkey" FOREIGN KEY ("conferencia_id") REFERENCES "public"."conferencia_estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forma_pagamento" ADD CONSTRAINT "forma_pagamento_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra" ADD CONSTRAINT "pedido_compra_local_entrada_id_fkey" FOREIGN KEY ("local_entrada_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra_item" ADD CONSTRAINT "pedido_compra_item_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "public"."pedido_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_compra_item" ADD CONSTRAINT "pedido_compra_item_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagamento" ADD CONSTRAINT "pagamento_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."venda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagamento" ADD CONSTRAINT "pagamento_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "public"."forma_pagamento"("idFormaPag") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcelamento" ADD CONSTRAINT "parcelamento_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcelas" ADD CONSTRAINT "parcelas_parcelamento_id_fkey" FOREIGN KEY ("parcelamento_id") REFERENCES "public"."parcelamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_local_saida_id_fkey" FOREIGN KEY ("local_saida_id") REFERENCES "public"."local_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda" ADD CONSTRAINT "venda_parcelamento_id_fkey" FOREIGN KEY ("parcelamento_id") REFERENCES "public"."parcelamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda_item" ADD CONSTRAINT "venda_item_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venda_item" ADD CONSTRAINT "venda_item_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "public"."produto_sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
