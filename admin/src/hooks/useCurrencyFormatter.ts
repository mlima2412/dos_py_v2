import React from "react";
import { usePartnerContext } from "@/hooks/usePartnerContext";

/**
 * Hook personalizado para formatação de moeda
 * Usa locale e isoCode do parceiro selecionado para formatar valores monetários
 */
export const useCurrencyFormatter = () => {
	const { selectedPartnerLocale, selectedPartnerIsoCode } = usePartnerContext();

	const formatCurrency = React.useCallback(
		(amount: number): string => {
			// Se não temos informações de moeda do parceiro, usar Real brasileiro como fallback
			if (!selectedPartnerLocale || !selectedPartnerIsoCode) {
				return new Intl.NumberFormat("pt-BR", {
					style: "currency",
					currency: "BRL",
				}).format(amount);
			}

			try {
				// Usar locale e isoCode específicos do parceiro
				return new Intl.NumberFormat(selectedPartnerLocale, {
					style: "currency",
					currency: selectedPartnerIsoCode,
				}).format(amount);
			} catch (error) {
				// Fallback para formato simples em caso de erro
				return `${selectedPartnerIsoCode} ${amount.toFixed(2)}`;
			}
		},
		[selectedPartnerLocale, selectedPartnerIsoCode]
	);

	return {
		formatCurrency,
		locale: selectedPartnerLocale,
		currency: selectedPartnerIsoCode,
	};
};

export default useCurrencyFormatter;
