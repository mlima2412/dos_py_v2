import { useMemo } from 'react';
import { createColumns } from './columns';
import { useToast } from '@/hooks/useToast';
import { useDespesasControllerRemove } from '@/api-client/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook para gerenciar colunas responsivas
 * Em telas pequenas, oculta colunas menos importantes
 */
export const useResponsiveColumns = (t: (key: string) => string, isMobile: boolean = false) => {
  const toast = useToast();
  const deleteMutation = useDespesasControllerRemove();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Verificar se o usuário é admin (assumindo que existe uma propriedade role ou isAdmin)
  const isAdmin = user?.role === 'ADMIN' || user?.isAdmin || true; // Temporariamente true para teste
  
  const handleDelete = async (publicId: string) => {
    try {
      await deleteMutation.mutateAsync({ publicId });
      // Invalidar as queries de despesas para atualizar a lista
      await queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast.success(t('expenses.messages.deleteSuccess'));
    } catch {
      toast.error(t('expenses.messages.deleteError'));
    }
  };
  
  return useMemo(() => {
    const allColumns = createColumns(t, handleDelete, isAdmin);
    
    if (!isMobile) {
      return allColumns;
    }
    
    // Em dispositivos móveis, mostra apenas as colunas essenciais
    return allColumns.filter((_, index) => {
      // 0: descrição, 1: data, 2: subcategoria, 3: valor, 4: actions
      const essentialIndexes = [0, 2, 3, 4];
      return essentialIndexes.includes(index);
    });
  }, [t, isMobile, handleDelete, isAdmin]);
};

/**
 * Hook simples para detectar dispositivos móveis
 * Baseado na largura da tela
 */
export const useIsMobile = () => {
  // Em um projeto real, você poderia usar uma biblioteca como react-use
  // ou implementar um hook mais robusto com useEffect e window.matchMedia
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth < 768; // Tailwind md breakpoint
};