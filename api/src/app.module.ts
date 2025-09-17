import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PerfisModule } from './perfis/perfis.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { ParceirosModule } from './parceiros/parceiros.module';
import { CanalOrigemModule } from './canal-origem/canal-origem.module';
import { ClientesModule } from './clientes/clientes.module';
import { CategoriaDespesasModule } from './categoria-despesas/categoria-despesas.module';
import { SubCategoriaDespesaModule } from './subcategoria-despesa/subcategoria-despesa.module';
import { DespesasModule } from './despesas/despesas.module';
import { DespesasRecorrentesModule } from './despesas-recorrentes/despesas-recorrentes.module';
import { DespesaCacheModule } from './cash/despesas/despesa-cache/despesa-cache.module';
import { DespesaClassificacaoCacheModule } from './cash/despesas/despesa-classificacao-cache/despesa-classificacao-cache.module';
import { ContasPagarModule } from './contas-pagar/contas-pagar.module';
import { CurrencyModule } from './currency/currency.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

import { RedisModule } from './redis/redis.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CategoriaProdutoModule } from './categoria-produto/categoria-produto.module';
import { ProdutoModule } from './produto/produto.module';
import { ProdutoSkuModule } from './produto-sku/produto-sku.module';
import { LocalEstoqueModule } from './local-estoque/local-estoque.module';
import { EstoqueSkuModule } from './estoque-sku/estoque-sku.module';
import { MovimentoEstoqueModule } from './movimento-estoque/movimento-estoque.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    PerfisModule,
    FornecedoresModule,
    ParceirosModule,
    CanalOrigemModule,
    ClientesModule,
    CategoriaDespesasModule,
    SubCategoriaDespesaModule,
    DespesasModule,
    DespesasRecorrentesModule,
    DespesaCacheModule,
    DespesaClassificacaoCacheModule,
    ContasPagarModule,
    CurrencyModule,
    PasswordResetModule,
    RedisModule,
    CategoriaProdutoModule,
    ProdutoModule,
    ProdutoSkuModule,
    LocalEstoqueModule,
    EstoqueSkuModule,
    MovimentoEstoqueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
