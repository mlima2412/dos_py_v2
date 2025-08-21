import { useInfiniteQuery } from "@tanstack/react-query";
import {
	useFornecedoresControllerFindAll,
	useFornecedoresControllerFindActiveFornecedores,
	fornecedoresControllerFindAll,
	type Fornecedor,
} from "../api-client/index";

// Tipo customizado para Fornecedor com relações
export type FornecedorWithRelations = Fornecedor;

export interface FornecedoresResponse {
	data: FornecedorWithRelations[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface UseFornecedoresParams {
	search?: string;
	parceiroId?: number;
	ativo?: boolean;
	limit?: number;
}

export function useFornecedores(params: UseFornecedoresParams = {}) {
	const { search, parceiroId, ativo, limit = 20 } = params;

	return useInfiniteQuery({
		queryKey: ["fornecedores", { search, ativo, limit, parceiroId }],
		queryFn: async ({ pageParam = 1 }) => {
			// Como não há endpoint paginado, vamos simular paginação no frontend
			if (!parceiroId) {
				throw new Error('parceiroId é obrigatório');
			}
			const allFornecedores = await fornecedoresControllerFindAll(parceiroId);

			// Filtrar por busca
			let filteredFornecedores = allFornecedores;
			if (search) {
				filteredFornecedores = allFornecedores.filter(
					(fornecedor) =>
						fornecedor.nome.toLowerCase().includes(search.toLowerCase()) ||
						(fornecedor.email &&
							fornecedor.email.toLowerCase().includes(search.toLowerCase()))
				);
			}

			// Filtrar por ativo
			if (ativo !== undefined) {
				filteredFornecedores = filteredFornecedores.filter(
					(fornecedor) => fornecedor.ativo === ativo
				);
			}

			// Simular paginação
			const total = filteredFornecedores.length;
			const totalPages = Math.ceil(total / limit);
			const startIndex = (pageParam - 1) * limit;
			const endIndex = startIndex + limit;
			const data = filteredFornecedores.slice(startIndex, endIndex);

			return {
				data,
				total,
				page: pageParam,
				limit,
				totalPages,
			};
		},
		getNextPageParam: (lastPage) => {
			const currentPage = lastPage.page || 0;
			const totalPages = lastPage.totalPages || 0;
			return currentPage < totalPages ? currentPage + 1 : undefined;
		},
		initialPageParam: 1,
	});
}

export function useFornecedoresAll(parceiroId: number) {
	return useFornecedoresControllerFindAll(parceiroId);
}

export function useFornecedoresAtivos() {
	return useFornecedoresControllerFindActiveFornecedores();
}

export type { UseFornecedoresParams };
