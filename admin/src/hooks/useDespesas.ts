import { useInfiniteQuery } from '@tanstack/react-query';
import {
  despesasControllerFindPaginated,
  type DespesasControllerFindPaginatedQueryParams,
  type Despesa,
} from '../api-client/index';

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
  limit?: number;
}

export function useDespesas(params: UseDespesasParams = {}) {
  const { search, parceiroId, fornecedorId, subCategoriaId, limit = 20 } = params;

  const queryParams: DespesasControllerFindPaginatedQueryParams = {
    page: '1',
    limit: limit.toString(),
    search: search || '',
    parceiroId: parceiroId || '',
    fornecedorId: fornecedorId || '',
    subCategoriaId: subCategoriaId || '',
  };

  return useInfiniteQuery({
    queryKey: ['despesas', { search, parceiroId, fornecedorId, subCategoriaId, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const paginatedParams = {
        ...queryParams,
        page: pageParam.toString(),
      };
      
      return despesasControllerFindPaginated(paginatedParams);
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page || 0;
      const totalPages = lastPage.totalPages || 0;
      return currentPage < totalPages
        ? currentPage + 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export type { UseDespesasParams };