import { useMemo } from "react";
import { createColumns } from "./columns";
import { useToast } from "@/hooks/useToast";
import { useDespesasControllerRemove } from "@/api-client/hooks";
import { useContasPagarParcelasControllerUpdate } from "@/api-client/hooks";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePartnerContext } from "@/hooks/usePartnerContext";

/**
 * Hook para gerenciar colunas responsivas
 * Em telas pequenas, oculta colunas menos importantes
 */
export const useResponsiveColumns = (
	t: (key: string) => string,
	isMobile: boolean = false
) => {
	const { t: translate } = useTranslation();
	const toast = useToast();
	const deleteMutation = useDespesasControllerRemove();
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { selectedPartnerId } = usePartnerContext();

	// Verificar se o usuário é admin baseado no perfil
	const isAdmin = user?.perfil?.nome === "ADMIN";

	const handleDelete = async (publicId: string) => {
		try {
			if (!selectedPartnerId) {
				throw new Error("Nenhum parceiro selecionado");
			}

			await deleteMutation.mutateAsync({
				publicId,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
			});

			// Invalidar as queries para atualizar a lista
			await queryClient.invalidateQueries({ queryKey: ["despesas"] });
			await queryClient.invalidateQueries({ queryKey: ["contas-pagar"] });

			toast.success(translate("expenses.messages.deleteSuccess"));
		} catch (error) {
			console.error("Erro ao deletar despesa:", error);
			toast.error(translate("expenses.messages.deleteError"));
		}
	};

	const updateContasPagarParcelasMutation =
		useContasPagarParcelasControllerUpdate();

	const handleMarkAsPaid = async (despesaPublicId: string) => {
		try {
			if (!selectedPartnerId) {
				throw new Error("Nenhum parceiro selecionado");
			}

			// Primeiro, buscar a despesa pelo publicId para obter o id numérico
			const { despesasControllerFindOne } = await import("@/api-client/hooks");
			const despesa = await despesasControllerFindOne(despesaPublicId, {
				"x-parceiro-id": Number(selectedPartnerId),
			});

			if (!despesa || !despesa.id) {
				throw new Error("Despesa não encontrada");
			}

			// Agora buscar a conta a pagar relacionada à despesa usando o id numérico
			const { contasPagarControllerFindByDespesa } = await import(
				"@/api-client/hooks"
			);
			const contasPagarResponse = await contasPagarControllerFindByDespesa(
				despesa.id
			);

			if (contasPagarResponse && contasPagarResponse.length > 0) {
				const contasPagar = contasPagarResponse[0];

				// Buscar todas as parcelas da conta a pagar
				const { contasPagarParcelasControllerFindByContasPagar } = await import(
					"@/api-client/hooks"
				);
				const parcelas = await contasPagarParcelasControllerFindByContasPagar(
					contasPagar.id
				);

				// Marcar todas as parcelas não pagas como pagas
				const parcelasNaoPagas = parcelas.filter(parcela => !parcela.pago);

				for (const parcela of parcelasNaoPagas) {
					await updateContasPagarParcelasMutation.mutateAsync({
						publicId: parcela.publicId,
						data: {
							pago: true,
							dataPagamento: new Date().toISOString(),
						},
					});
				}

				// Invalidar as queries para atualizar a lista
				await queryClient.invalidateQueries({ queryKey: ["despesas"] });
				await queryClient.invalidateQueries({ queryKey: ["contas-pagar"] });
				await queryClient.invalidateQueries({
					queryKey: ["contas-pagar-parcelas"],
				});

				toast.success(translate("expenses.messages.markAsPaidSuccess"));
			} else {
				throw new Error("Conta a pagar não encontrada para esta despesa");
			}
		} catch (error) {
			console.error("Erro ao marcar como paga:", error);
			toast.error(translate("expenses.messages.markAsPaidError"));
		}
	};

	return useMemo(() => {
		const allColumns = createColumns(
			t,
			handleDelete,
			isAdmin,
			handleMarkAsPaid
		);

		if (!isMobile) {
			return allColumns;
		}

		// Em dispositivos móveis, mostra apenas as colunas essenciais
		return allColumns.filter((_, index) => {
			// 0: descrição, 1: data, 2: fornecedor, 3: categoria, 4: currency, 5: status, 6: valor, 7: actions
			const essentialIndexes = [0, 5, 6, 7]; // descrição, status, valor, actions
			return essentialIndexes.includes(index);
		});
	}, [t, isMobile, handleDelete, isAdmin]);
};

/**
 * Hook simples para detectar dispositivos móveis
 * Baseado na largura da tela
 */
export const useIsMobile = () => {
	// Em um projeto real, você poderia usar uma biblioteca como react-use
	// ou implementar um hook mais robusto com useEffect e window.matchMedia
	if (typeof window === "undefined") return false;

	return window.innerWidth < 768; // Tailwind md breakpoint
};
