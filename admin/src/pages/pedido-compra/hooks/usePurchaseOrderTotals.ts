import React from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PedidoCompraBasicFormData } from "../pedidoCompraSchema";
import type { SelectedSkuItem } from "../types";
import { parseToNumber, safeNumber } from "../utils/numberUtils";

export interface PurchaseOrderTotals {
	valorFrete: number;
	valorComissao: number;
	cotacao: number;
	valorProdutos: number;
	totalOriginal: number;
	totalConvertido: number;
}

interface UsePurchaseOrderTotalsParams {
	form: UseFormReturn<PedidoCompraBasicFormData>;
	getItems: () => SelectedSkuItem[];
}

export const usePurchaseOrderTotals = ({
	form,
	getItems,
}: UsePurchaseOrderTotalsParams) => {
	const [valorTotalOriginal, setValorTotalOriginal] = React.useState("0.00");
	const [valorTotalConvertido, setValorTotalConvertido] = React.useState("0.00");

	const computeConvertedTotal = React.useCallback(
		(originalRaw: unknown, cotacaoRaw: unknown) => {
			const original = safeNumber(originalRaw, 0);
			const cotacao = safeNumber(cotacaoRaw ?? 1, 1);
			return original * cotacao;
		},
		[]
	);

	const resolveTotalsFromData = React.useCallback(
		(values: Partial<PedidoCompraBasicFormData>, items: SelectedSkuItem[]) => {
			const valorFreteNumber = parseToNumber(values.valorFrete ?? "0");
			const valorComissaoNumber = parseToNumber(values.valorComissao ?? "0");
			const cotacaoNumber = parseToNumber(values.cotacao ?? "1");

			const valorFrete = Number.isNaN(valorFreteNumber) ? 0 : valorFreteNumber;
			const valorComissao = Number.isNaN(valorComissaoNumber)
				? 0
				: valorComissaoNumber;
			const cotacao = Number.isNaN(cotacaoNumber) ? 1 : cotacaoNumber;

			const valorProdutos = items.reduce((total, item) => {
				return total + item.unitPrice * item.quantity;
			}, 0);

			const totalOriginal = valorFrete + valorComissao + valorProdutos;
			const totalConvertido = totalOriginal * cotacao;

			return {
				valorFrete,
				valorComissao,
				cotacao,
				valorProdutos,
				totalOriginal,
				totalConvertido,
			};
		},
		[]
	);

	const updateTotalsState = React.useCallback(
		(
			itemsArg?: SelectedSkuItem[],
			valuesArg?: Partial<PedidoCompraBasicFormData>
		): PurchaseOrderTotals => {
			const currentItems = itemsArg ?? getItems();
			const currentValues = valuesArg ?? form.getValues();
			const totals = resolveTotalsFromData(currentValues, currentItems);

			setValorTotalOriginal(totals.totalOriginal.toFixed(2));
			setValorTotalConvertido(totals.totalConvertido.toFixed(2));
			return totals;
		},
		[form, getItems, resolveTotalsFromData]
	);

	const refreshTotals = React.useCallback(
		(patch?: Partial<PedidoCompraBasicFormData>) => {
			const baseValues = form.getValues();
			const mergedValues = patch ? { ...baseValues, ...patch } : baseValues;
			updateTotalsState(undefined, mergedValues);
		},
		[form, updateTotalsState]
	);

	return {
		valorTotalOriginal,
		valorTotalConvertido,
		computeConvertedTotal,
		resolveTotalsFromData,
		updateTotalsState,
		refreshTotals,
	};
};
