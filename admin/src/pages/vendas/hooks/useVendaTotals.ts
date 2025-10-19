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
		const itensSubtotal = itensSelecionados.reduce((acc, item) => {
			const subtotal = item.qtdReservada * item.precoUnit;
			const itemDesconto = item.desconto ?? 0;
			return acc + (subtotal - itemDesconto);
		}, 0);

		const descontoItens = itensSelecionados.reduce((acc, item) => {
			return acc + (item.desconto ?? 0);
		}, 0);

		const descontoGeral = descontoTotal ?? 0;
		const frete = valorFrete ?? 0;
		const comissaoValue = comissao ?? 0;
		const total = itensSubtotal - descontoGeral + frete;

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
