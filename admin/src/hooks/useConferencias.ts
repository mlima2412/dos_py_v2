import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { conferenciaEstoqueControllerFindAll } from "@/api-client";
import type { ConferenciaEstoqueResponseDto } from "@/api-client";

interface UseConferenciasParams {
	search?: string;
	parceiroId?: number;
	limit?: number;
}

type ConferenciaEstoque = ConferenciaEstoqueResponseDto & {
	parceiroId?: number;
	LocalEstoque?: {
		nome?: string;
		descricao?: string;
	};
};

export function useConferencias(params: UseConferenciasParams = {}) {
	const { search, parceiroId, limit = 20 } = params;

	return useInfiniteQuery({
		queryKey: ["conferencias", { search, parceiroId, limit }],
		queryFn: async ({ pageParam = 1 }) => {
			try {
				// Buscar todas as conferências
				const allConferencias = await conferenciaEstoqueControllerFindAll({
					"x-parceiro-id": parceiroId || 1, // Usar parceiro padrão se não especificado
				});

				// Filtrar por parceiro se necessário
				let filteredConferencias = allConferencias;
				if (parceiroId && parceiroId !== 1) {
					filteredConferencias = allConferencias.filter(
						(conferencia: ConferenciaEstoque) =>
							conferencia.parceiroId === parceiroId
					);
				}

				// Filtrar por busca se necessário
				if (search) {
					filteredConferencias = filteredConferencias.filter(
						(conferencia: ConferenciaEstoque) => {
							const searchTerm = search.toLowerCase();
							const localMatches =
								conferencia.localNome?.toLowerCase().includes(searchTerm) ||
								conferencia.LocalEstoque?.nome
									?.toLowerCase()
									.includes(searchTerm) ||
								conferencia.LocalEstoque?.descricao
									?.toLowerCase()
									.includes(searchTerm);
							const usuarioMatches =
								(typeof conferencia.Usuario === "string"
									? conferencia.Usuario.toLowerCase()
									: ""
								).includes(searchTerm);

							return localMatches || usuarioMatches;
						}
					);
				}

				// Simular paginação
				const total = filteredConferencias.length;
				const totalPages = Math.ceil(total / limit);
				const startIndex = (pageParam - 1) * limit;
				const endIndex = startIndex + limit;
				const data = filteredConferencias.slice(startIndex, endIndex);

				return {
					data,
					total,
					page: pageParam,
					limit,
					totalPages,
				};
			} catch (error) {
				console.error("Erro ao buscar conferências:", error);
				return {
					data: [],
					total: 0,
					page: pageParam,
					limit,
					totalPages: 0,
				};
			}
		},
		getNextPageParam: lastPage => {
			const currentPage = lastPage.page || 0;
			const totalPages = lastPage.totalPages || 0;
			return currentPage < totalPages ? currentPage + 1 : undefined;
		},
		initialPageParam: 1,
		enabled: true,
	});
}

// Hook para marcar conferência como concluída
export function useCompleteConferencia() {
	const queryClient = useQueryClient();

	return {
		completeConferencia: async (_conferenciaId: string) => {
			// TODO: Implementar chamada para API de atualização
			// Por enquanto, apenas invalidar a query para recarregar os dados
			await queryClient.invalidateQueries({
				queryKey: ["conferencias"],
			});
		},
	};
}
