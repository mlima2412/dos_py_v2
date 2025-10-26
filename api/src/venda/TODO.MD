Necessito implementar a fase de finalização da venda no backend(api) de acordo com o tipo Venda, Brinde ou Condicional segundo os tipos definidos

Uma finalização da venda gera movimento estoque de acordo com o local escolhido no formulário de venda.
Analise em detalhe as relações de vendas e vendaItens@movimento-estoque.service.ts

A movimentação de estoque deve ser utilizada para todos os itens selecionados na venda.

O estados da venda devem ser ajustado depois do processo.

Todo o processo deve estar dentro de uma transação do prisma.

@schema.prisma @venda.service.ts @venda-item.service.ts
