import { useQueryClient } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
	produtoControllerFindPaginated,
	useProdutoControllerActivate,
	useProdutoControllerDeactivate,
} from "@/api-client";
import type { ProdutoControllerFindPaginatedQueryParams } from "@/api-client/types";
import { useToast } from "./useToast";

interface UseProdutosParams {
	search?: string;
	categoriaId?: string;
	ativo?: boolean;
	limit?: number;
	parceiroId?: number;
}

export function useProdutos(params: UseProdutosParams = {}) {
	const { search, categoriaId, ativo, limit = 20, parceiroId } = params;

	const queryParams: ProdutoControllerFindPaginatedQueryParams = {
		page: "1",
		limit: limit.toString(),
		search: search || "",
		categoriaId: categoriaId || "",
		ativo: ativo !== undefined ? ativo.toString() : "",
	};

	const headers = {
		"x-parceiro-id": parceiroId || 0,
	};

	return useInfiniteQuery({
		queryKey: ["produtos", { search, categoriaId, ativo, limit, parceiroId }],
		queryFn: async ({ pageParam = 1 }) => {
			const paginatedParams = {
				...queryParams,
				page: pageParam.toString(),
			};

			return produtoControllerFindPaginated(headers, paginatedParams);
		},
		getNextPageParam: lastPage => {
			const currentPage = lastPage.page || 0;
			const totalPages = lastPage.totalPages || 0;
			return currentPage < totalPages ? currentPage + 1 : undefined;
		},
		initialPageParam: 1,
		enabled: !!parceiroId,
	});
}

// Hook para ativar produto
export function useAtivarProduto() {
	const queryClient = useQueryClient();
	const { success, error } = useToast();

	return useProdutoControllerActivate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["produtos"] });
				success("Produto ativado com sucesso!");
			},
			onError: () => {
				error("Erro ao ativar produto. Tente novamente.");
			},
		},
	});
}

// Hook para desativar produto
export function useDesativarProduto() {
	const queryClient = useQueryClient();
	const { success, error } = useToast();

	return useProdutoControllerDeactivate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["produtos"] });
				success("Produto desativado com sucesso!");
			},
			onError: () => {
				error("Erro ao desativar produto. Tente novamente.");
			},
		},
	});
}
