import { useAuthControllerGetUserParceiros } from '@/api-client';
import { useAuth } from './useAuth';

/**
 * Hook personalizado para buscar os parceiros do usuário logado
 * 
 * @returns {
 *   data: Array de parceiros do usuário,
 *   isLoading: boolean indicando se está carregando,
 *   error: erro caso ocorra,
 *   refetch: função para recarregar os dados
 * }
 */
export function useUserParceiros() {
  const { isAuthenticated } = useAuth();
  
  const {
    data: parceiros,
    isLoading,
    error,
    refetch,
  } = useAuthControllerGetUserParceiros({
    query: {
      // Configurações opcionais do React Query
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
      enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
    },
  });

  return {
    parceiros: parceiros || [],
    isLoading,
    error,
    refetch,
  };
}

export default useUserParceiros;