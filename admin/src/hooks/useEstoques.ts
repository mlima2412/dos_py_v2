import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
	useLocalEstoqueControllerCreate,
	useLocalEstoqueControllerUpdate,
	localEstoqueControllerFindAll,
} from "@/api-client";
import type { LocalEstoque } from "@/api-client/types";

interface UseLocaisEstoqueParams {
	search?: string;
	parceiroId?: number;
	limit?: number;
}

export function useLocaisEstoque(params: UseLocaisEstoqueParams = {}) {
	const { search, parceiroId, limit = 20 } = params;

	return useInfiniteQuery({
		queryKey: ["locaisEstoque", { search, parceiroId, limit }],
		queryFn: async ({ pageParam = 1 }) => {
			try {
				// Agora o endpoint retorna todos os locais de estoque diretamente
				const allLocais = await localEstoqueControllerFindAll();

				// Filtrar por parceiro se necessário
				let filteredLocais = allLocais;
				if (parceiroId && parceiroId !== 0) {
					filteredLocais = allLocais.filter(
						(local: LocalEstoque) => local.parceiroId === parceiroId
					);
				}

				// Filtrar por busca se necessário
				if (search) {
					filteredLocais = filteredLocais.filter((local: LocalEstoque) => {
						const searchTerm = search.toLowerCase();
						return (
							local.nome?.toLowerCase().includes(searchTerm) ||
							local.descricao?.toLowerCase().includes(searchTerm) ||
							local.endereco?.toLowerCase().includes(searchTerm)
						);
					});
				}

				// Simular paginação
				const total = filteredLocais.length;
				const totalPages = Math.ceil(total / limit);
				const startIndex = (pageParam - 1) * limit;
				const endIndex = startIndex + limit;
				const data = filteredLocais.slice(startIndex, endIndex);

				return {
					data,
					total,
					page: pageParam,
					limit,
					totalPages,
				};
			} catch (error) {
				console.error("Erro ao buscar locais de estoque:", error);
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
		enabled: true, // Para administradores, sempre habilitado
	});
}

// Hook para criar local de estoque
export function useCreateLocalEstoque() {
	const queryClient = useQueryClient();

	const mutation = useLocalEstoqueControllerCreate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["locaisEstoque"] });
			},
		},
	});

	return mutation;
}

// Hook para atualizar local de estoque
export function useUpdateLocalEstoque() {
	const queryClient = useQueryClient();

	const mutation = useLocalEstoqueControllerUpdate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["locaisEstoque"] });
			},
		},
	});

	return mutation;
}

export type { UseLocaisEstoqueParams };
