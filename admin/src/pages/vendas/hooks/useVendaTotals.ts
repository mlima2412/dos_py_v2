import { useCallback, useMemo } from "react";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import type { VendaItemFormData, VendaTotals } from "../types";

export const useVendaTotals = (
	itensSelecionados: VendaItemFormData[],
	descontoTotal: number | null | undefined,
	valorFrete: number | null | undefined,
	comissao: number | null | undefined
) => {
	const { selectedPartnerLocale, selectedPartnerIsoCode } = usePartnerContext();

	const totals = useMemo<VendaTotals>(() => {
		// 1. Subtotal dos itens SEM descontos
		const itensSubtotal = itensSelecionados.reduce((acc, item) => {
			const subtotal = item.qtdReservada * item.precoUnit;
			return acc + subtotal;
		}, 0);

		// 2. Total de descontos aplicados nos itens
		const descontoItens = itensSelecionados.reduce((acc, item) => {
			return acc + (item.desconto ?? 0);
		}, 0);

		// 3. Outros valores
		const descontoGeral = descontoTotal ?? 0;
		const frete = valorFrete ?? 0;
		const comissaoValue = comissao ?? 0;

		// 4. Total = subtotal - descontos dos itens - desconto geral + frete
		const total = itensSubtotal - descontoItens - descontoGeral + frete;

		return {
			itensSubtotal,
			descontoItens,
			descontoGeral,
			frete,
			comissao: comissaoValue,
			total,
		};
	}, [itensSelecionados, descontoTotal, valorFrete, comissao]);

	const formatCurrency = useCallback(
		(value: number) => {
			if (!Number.isFinite(value)) return "-";

			return new Intl.NumberFormat(selectedPartnerLocale || "pt-BR", {
				style: "currency",
				currency: selectedPartnerIsoCode || "BRL",
			}).format(value);
		},
		[selectedPartnerIsoCode, selectedPartnerLocale]
	);

	return { totals, formatCurrency };
};
