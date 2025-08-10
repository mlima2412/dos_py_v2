import { useInfiniteQuery } from '@tanstack/react-query';
import {
  useParceirosControllerFindAll,
  useParceirosControllerFindActiveParceiros,
  parceirosControllerFindPaginated,
  type ParceirosControllerFindPaginatedQueryParams,
} from '../api-client/index';

interface UseParceirosParams {
  search?: string;
  ativo?: boolean;
  limit?: number;
}

export function useParceiros(params: UseParceirosParams = {}) {
  const { search, ativo, limit = 20 } = params;

  const queryParams: ParceirosControllerFindPaginatedQueryParams = {
    page: '1',
    limit: limit.toString(),
    search: search || '',
    ativo: ativo !== undefined ? ativo.toString() : '',
  };

  return useInfiniteQuery({
    queryKey: ['parceiros', { search, ativo, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const paginatedParams = {
        ...queryParams,
        page: pageParam.toString(),
      };
      
      return parceirosControllerFindPaginated(paginatedParams);
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

export function useParceirosAll() {
  return useParceirosControllerFindAll();
}

export function useParceirosAtivos() {
  return useParceirosControllerFindActiveParceiros();
}

export type { UseParceirosParams };