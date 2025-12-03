import { useInfiniteQuery } from "@tanstack/react-query";
import {
	despesasControllerFindPaginated,
	type DespesasControllerFindPaginatedQueryParams,
	type Despesa,
} from "../api-client/index";

export interface DespesasResponse {
	data: Despesa[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface UseDespesasParams {
	search?: string;
	parceiroId?: string;
	fornecedorId?: string;
	subCategoriaId?: string;
	grupoDreId?: string;
	year?: string;
	month?: string;
	limit?: number;
}

export function useDespesas(params: UseDespesasParams = {}) {
	const {
		search,
		parceiroId,
		fornecedorId,
		subCategoriaId,
		grupoDreId,
		year,
		month,
		limit = 20,
	} = params;

	const queryParams: DespesasControllerFindPaginatedQueryParams & {
		year?: string;
		month?: string;
	} = {
		page: "1",
		limit: limit.toString(),
		search: search || "",
		fornecedorId: fornecedorId || "",
		subCategoriaId: subCategoriaId || "",
		grupoDreId: grupoDreId || "",
		year: year || "",
		month: month || "",
	};

	return useInfiniteQuery({
		queryKey: [
			"despesas",
			{ search, parceiroId, fornecedorId, subCategoriaId, grupoDreId, year, month, limit },
		],
		queryFn: async ({ pageParam = 1 }) => {
			const paginatedParams = {
				...queryParams,
				page: pageParam.toString(),
			};

			return despesasControllerFindPaginated(paginatedParams);
		},
		getNextPageParam: lastPage => {
			const currentPage = lastPage.page || 0;
			const totalPages = lastPage.totalPages || 0;
			return currentPage < totalPages ? currentPage + 1 : undefined;
		},
		initialPageParam: 1,
	});
}

export type { UseDespesasParams };
