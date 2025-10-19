import { useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import {
	usePagamentoControllerCreate,
	useParcelamentoControllerCreate,
	useParcelasControllerCreate,
} from "@/api-client";
import { addMonths } from "date-fns";
import type { PagamentoFormData } from "../types";
import type { PagamentoTipoEnum } from "@/api-client/types";

interface UseVendaFinalizationProps {
	parceiroIdNumber: number | null;
	vendaId: number | undefined;
	clienteId: number | undefined;
}

export const useVendaFinalization = ({
	parceiroIdNumber,
	vendaId,
	clienteId,
}: UseVendaFinalizationProps) => {
	const { error: showError } = useToast();

	const pagamentoCreateMutation = usePagamentoControllerCreate();
	const parcelamentoCreateMutation = useParcelamentoControllerCreate();
	const parcelaCreateMutation = useParcelasControllerCreate();

	const calcularVencimentoParcela = (
		dataInicial: Date | undefined,
		numeroParcela: number
	): string => {
		if (!dataInicial) {
			const hoje = new Date();
			return addMonths(hoje, numeroParcela - 1).toISOString();
		}
		return addMonths(dataInicial, numeroParcela - 1).toISOString();
	};

	const processarPagamento = useCallback(
		async (tipoVenda: PagamentoTipoEnum, pagamento: PagamentoFormData) => {
			if (!vendaId || !clienteId || !parceiroIdNumber) {
				throw new Error("Dados da venda incompletos");
			}

			// 1. SEMPRE criar registro de Pagamento
			const pagamentoCriado = await pagamentoCreateMutation.mutateAsync({
				data: {
					vendaId,
					formaPagamentoId: pagamento.formaPagamentoId,
					tipo: tipoVenda, // ← Tipo global da venda
					valor: pagamento.valor,
					entrada: pagamento.entrada,
					valorDelivery: pagamento.valorDelivery,
				},
				headers: {
					"x-parceiro-id": parceiroIdNumber ?? 0,
				},
			});

			// 2. Se NÃO for à vista, criar Parcelamento + Parcelas
			if (tipoVenda !== "A_VISTA_IMEDIATA") {
				const parcelamento = await parcelamentoCreateMutation.mutateAsync({
					data: {
						idPagamento: pagamentoCriado.id,
						clienteId,
						valorTotal: pagamento.valor,
						idFormaPag: pagamento.formaPagamentoId,
						valorPago: 0,
						situacao: 1, // 1 = Aberto
					},
				});

				// 3. Criar Parcelas conforme tipo global
				if (tipoVenda === "PARCELADO" && pagamento.numeroParcelas) {
					const valorParcela = pagamento.valor / pagamento.numeroParcelas;

					for (let i = 1; i <= pagamento.numeroParcelas; i++) {
						await parcelaCreateMutation.mutateAsync({
							data: {
								parcelamentoId: parcelamento.id,
								numero: i,
								valor: valorParcela,
								vencimento: calcularVencimentoParcela(
									pagamento.primeiraParcelaData,
									i
								),
								status: "PENDENTE",
							},
						});
					}
				} else if (tipoVenda === "A_PRAZO_SEM_PARCELAS") {
					// Criar 1 parcela única
					await parcelaCreateMutation.mutateAsync({
						data: {
							parcelamentoId: parcelamento.id,
							numero: 1,
							valor: pagamento.valor,
							vencimento: pagamento.vencimento
								? pagamento.vencimento.toISOString()
								: new Date().toISOString(),
							status: "PENDENTE",
						},
					});
				} else if (tipoVenda === "PARCELADO_FLEXIVEL") {
					// Para parcelamento flexível, não cria parcelas predefinidas
					// O cliente vai pagando quando possível
					console.log("Parcelamento flexível criado sem parcelas fixas");
				}
			}
		},
		[
			vendaId,
			clienteId,
			parceiroIdNumber,
			pagamentoCreateMutation,
			parcelamentoCreateMutation,
			parcelaCreateMutation,
		]
	);

	const finalizarVendaComPagamentos = useCallback(
		async (tipoVenda: PagamentoTipoEnum, pagamentos: PagamentoFormData[]) => {
			if (!vendaId || !clienteId) {
				showError("Dados da venda incompletos");
				return false;
			}

			if (!tipoVenda) {
				showError("Selecione o tipo de venda");
				return false;
			}

			if (pagamentos.length === 0) {
				showError("Adicione ao menos uma forma de pagamento");
				return false;
			}

			try {
				// Processar cada forma de pagamento sequencialmente
				for (const pagamento of pagamentos) {
					await processarPagamento(tipoVenda, pagamento);
				}
				return true;
			} catch (error) {
				console.error("Erro ao processar pagamentos:", error);
				showError(
					"Erro ao processar pagamentos. Verifique os dados e tente novamente."
				);
				return false;
			}
		},
		[vendaId, clienteId, processarPagamento, showError]
	);

	return {
		finalizarVendaComPagamentos,
		isProcessingPagamento: pagamentoCreateMutation.isPending,
		isProcessingParcelamento: parcelamentoCreateMutation.isPending,
		isProcessingParcela: parcelaCreateMutation.isPending,
	};
};
