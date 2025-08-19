Criar duas tabelas de suporte para as estatísticas de despesas

```SQL
-- rollup_expenses_month 
CREATE TABLE rollup_expenses_month (
  organization_id uuid NOT NULL,
  ym char(7) NOT NULL,                 -- 'YYYY-MM'
  realized       NUMERIC(18,3) NOT NULL DEFAULT 0,
  to_pay         NUMERIC(18,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, ym)
);

-- rollup_expenses_month_cat
CREATE TABLE rollup_expenses_month_cat (
  organization_id uuid NOT NULL,
  ym char(7) NOT NULL,
  category_id uuid NOT NULL,
  realized       NUMERIC(18,3) NOT NULL DEFAULT 0,
  to_pay         NUMERIC(18,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, ym, category_id)
);
```

Essas tabelas serão atualizadas sempre que houver uma nova despesa ou uma despesa ser editada.
As consultas serão feitas diretamente nessas tabelas para obter as estatísticas.

Avaliar a possibilidade de integração com o Redis para cachear as consultas.
Se for possível, implementar um sistema de invalidar o cache quando houver uma nova despesa ou uma despesa ser editada.

Avaliar a possibilidade de usar o BullMQ para processar as atualizações das tabelas de suporte.
Se for possível, implementar um sistema de processamento assíncrono para atualizar as tabelas de suporte.