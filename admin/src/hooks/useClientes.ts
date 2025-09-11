import { useInfiniteQuery } from "@tanstack/react-query";
import {
	clientesControllerFindPaginated,
	type ClientesControllerFindPaginatedQueryParams,
	type ClientesControllerFindPaginatedHeaderParams,
	type ClientesControllerFindPaginated200,
} from "../api-client/index";
import { usePartnerContext } from "@/hooks/usePartnerContext";

interface UseClientesParams {
	search?: string;
	canalOrigemId?: number;
	ativo?: boolean;
	limit?: number;
}

export function useClientes(params: UseClientesParams = {}) {
	const { search, canalOrigemId, ativo, limit = 20 } = params;
	const { selectedPartnerId } = usePartnerContext();

	const headers: ClientesControllerFindPaginatedHeaderParams = {
		"x-parceiro-id": selectedPartnerId ? parseInt(selectedPartnerId) : 0,
	};

	return useInfiniteQuery<ClientesControllerFindPaginated200>({
		queryKey: ["clientes", { search, canalOrigemId, ativo, limit, parceiroId: selectedPartnerId }],
		queryFn: async ({ pageParam }) => {
			const page = typeof pageParam === 'number' ? pageParam : 1;
			const queryParams: ClientesControllerFindPaginatedQueryParams = {
				page: page.toString(),
				limit: limit.toString(),
				search: search || undefined,
				canalOrigemId: canalOrigemId?.toString() || undefined,
				ativo: ativo !== undefined ? ativo.toString() : undefined,
			};

			return clientesControllerFindPaginated(headers, queryParams);
		},
		getNextPageParam: (lastPage) => {
			if (lastPage.page && lastPage.totalPages && lastPage.page < lastPage.totalPages) {
				return lastPage.page + 1;
			}
			return undefined;
		},
		initialPageParam: 1,
		enabled: !!selectedPartnerId,
	});
}

export type { UseClientesParams };
