-- CreateEnum
CREATE TYPE "public"."Moedas" AS ENUM ('Real', 'Guaraníes', 'Dolar');

-- CreateEnum
CREATE TYPE "public"."Linguagem" AS ENUM ('Español', 'Portugues');

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
    "perfil_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
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
    "moeda_principal" "public"."Moedas" NOT NULL DEFAULT 'Real',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_compra" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuario_parceiro" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "parceiro_id" INTEGER NOT NULL,
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
    "moeda_principal" "public"."Moedas" NOT NULL DEFAULT 'Guaraníes',
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
    "sobrenome" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "ruccnpj" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "cep" TEXT,
    "observacoes" TEXT,
    "linguagem" "public"."Linguagem" NOT NULL DEFAULT 'Español',
    "moeda_principal" "public"."Moedas" NOT NULL DEFAULT 'Guaraníes',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "parceiro_id" INTEGER NOT NULL,
    "canal_origem_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_public_id_key" ON "public"."usuario"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "public"."usuario"("email");

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

-- AddForeignKey
ALTER TABLE "public"."usuario" ADD CONSTRAINT "usuario_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_parceiro" ADD CONSTRAINT "usuario_parceiro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_parceiro" ADD CONSTRAINT "usuario_parceiro_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cliente" ADD CONSTRAINT "cliente_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "public"."parceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cliente" ADD CONSTRAINT "cliente_canal_origem_id_fkey" FOREIGN KEY ("canal_origem_id") REFERENCES "public"."canal_origem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
