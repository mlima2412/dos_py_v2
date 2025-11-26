import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";
import { useVendaControllerProcessarDevolucao } from "@/api-client";
import type { VendaItemFormData } from "../types";

export const useCondicionalDevolucao = (
	vendaPublicId: string | undefined,
	parceiroId: number | null,
	itensSelecionados: VendaItemFormData[],
	onDevolucaoSuccess: () => void
) => {
	const { t } = useTranslation("common");
	const { success: showSuccess, error: showError } = useToast();
	const [isProcessing, setIsProcessing] = useState(false);

	const devolucaoMutation = useVendaControllerProcessarDevolucao({
		mutation: {
			onSuccess: () => {
				showSuccess(t("salesOrders.form.messages.returnProcessed"));
				onDevolucaoSuccess();
			},
			onError: (error: unknown) => {
				console.error("Erro ao processar devolução:", error);
				const mensagem =
					(error as { data?: { message?: string } })?.data?.message ??
					t("salesOrders.form.messages.returnError");
				showError(mensagem);
			},
		},
	});

	const processarDevolucao = async (skuId: number) => {
		if (!vendaPublicId || !parceiroId) {
			showError("Venda não identificada");
			return;
		}

		const item = itensSelecionados.find((i) => i.skuId === skuId);
		if (!item) {
			showError("Item não encontrado na venda");
			return;
		}

		const qtdJaDevolvida = item.qtdDevolvida ?? 0;
		const qtdRestante = item.qtdReservada - qtdJaDevolvida;

		if (qtdRestante <= 0) {
			showError(t("salesOrders.form.messages.itemAlreadyReturned"));
			return;
		}

		setIsProcessing(true);
		try {
			await devolucaoMutation.mutateAsync({
				publicId: vendaPublicId,
				headers: {
					"x-parceiro-id": parceiroId,
				},
				data: {
					skuId,
					qtdDevolvida: 1, // Cada scan = 1 unidade devolvida
				},
			});
		} finally {
			setIsProcessing(false);
		}
	};

	return {
		processarDevolucao,
		isProcessing: isProcessing || devolucaoMutation.isPending,
	};
};
