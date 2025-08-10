import { useInfiniteQuery } from '@tanstack/react-query';
import {
  useUsuariosControllerFindAll,
  useUsuariosControllerFindActiveUsers,
  usuariosControllerFindPaginated,
  type UsuariosControllerFindPaginatedQueryParams,
  type Usuario,
  type UsuarioParceiro,
} from '../api-client/index';

// Tipo customizado para Usuario com relações
export type UsuarioWithRelations = Usuario & {
  UsuarioParceiro?: UsuarioParceiro[];
};

export interface UsersResponse {
  data: UsuarioWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseUsersParams {
  search?: string;
  organizacao?: string;
  perfil?: string;
  ativo?: boolean;
  limit?: number;
}

export function useUsers(params: UseUsersParams = {}) {
  const { search, organizacao, perfil, ativo, limit = 20 } = params;

  const queryParams: UsuariosControllerFindPaginatedQueryParams = {
    page: '1',
    limit: limit.toString(),
    search: search || '',
    organizacao: organizacao || '',
    ativo: ativo !== undefined ? ativo.toString() : '',
  };

  return useInfiniteQuery({
    queryKey: ['users', { search, organizacao, perfil, ativo, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const paginatedParams = {
        ...queryParams,
        page: pageParam.toString(),
      };
      
      return usuariosControllerFindPaginated(paginatedParams);
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

export function useUsersAll() {
  return useUsuariosControllerFindAll();
}

export function useUsersAtivos() {
  return useUsuariosControllerFindActiveUsers();
}

export type { UseUsersParams };