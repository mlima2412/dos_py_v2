// Script de diagnóstico para debugging de totais
// Para usar: importe este arquivo e chame debugVendaTotals(itensSelecionados, totals)

import type { VendaItemFormData, VendaTotals } from './types';

export function debugVendaTotals(
  itens: VendaItemFormData[],
  totals: VendaTotals
) {
  console.group('🔍 DEBUG: Cálculo de Totais da Venda');

  console.log('\n📦 ITENS:');
  itens.forEach((item, index) => {
    const subtotalItem = item.qtdReservada * item.precoUnit;
    const totalItem = subtotalItem - (item.desconto ?? 0);

    console.log(`\nItem ${index + 1}:`);
    console.log(`  - SKU ID: ${item.skuId}`);
    console.log(`  - Produto: ${item.productName || 'N/A'}`);
    console.log(`  - Quantidade: ${item.qtdReservada}`);
    console.log(`  - Preço Unitário: R$ ${item.precoUnit.toFixed(2)}`);
    console.log(`  - Subtotal (qtd × preço): R$ ${subtotalItem.toFixed(2)}`);
    console.log(`  - Desconto Tipo: ${item.descontoTipo || 'N/A'}`);
    console.log(`  - Desconto Valor (informado): ${item.descontoValor ?? 0}`);
    console.log(`  - Desconto (calculado em R$): R$ ${(item.desconto ?? 0).toFixed(2)}`);
    console.log(`  - Total Item: R$ ${totalItem.toFixed(2)}`);
  });

  console.log('\n📊 TOTALS CALCULADOS:');
  console.log(`  - Subtotal Itens: R$ ${totals.itensSubtotal.toFixed(2)}`);
  console.log(`  - Desconto Itens: R$ ${totals.descontoItens.toFixed(2)}`);
  console.log(`  - Desconto Geral: R$ ${totals.descontoGeral.toFixed(2)}`);
  console.log(`  - Frete: R$ ${totals.frete.toFixed(2)}`);
  console.log(`  - Comissão: R$ ${totals.comissao.toFixed(2)}`);
  console.log(`  - TOTAL FINAL: R$ ${totals.total.toFixed(2)}`);

  console.log('\n🔢 FÓRMULA:');
  console.log(`  Total = SubtotalItens - DescontoItens - DescontoGeral + Frete`);
  console.log(`  Total = ${totals.itensSubtotal.toFixed(2)} - ${totals.descontoItens.toFixed(2)} - ${totals.descontoGeral.toFixed(2)} + ${totals.frete.toFixed(2)}`);
  console.log(`  Total = ${totals.total.toFixed(2)}`);

  console.log('\n✅ VERIFICAÇÃO:');
  const somaManual = totals.itensSubtotal - totals.descontoItens - totals.descontoGeral + totals.frete;
  const diferenca = Math.abs(somaManual - totals.total);
  console.log(`  - Soma Manual: R$ ${somaManual.toFixed(2)}`);
  console.log(`  - Total Retornado: R$ ${totals.total.toFixed(2)}`);
  console.log(`  - Diferença: R$ ${diferenca.toFixed(2)}`);
  console.log(`  - Status: ${diferenca < 0.01 ? '✓ CORRETO' : '❌ ERRO'}`);

  console.groupEnd();
}
