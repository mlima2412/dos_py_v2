import { useQueryClient } from '@tanstack/react-query';
import {
  useCanalOrigemControllerFindAll,
  useCanalOrigemControllerFindOne,
  useCanalOrigemControllerCreate,
  useCanalOrigemControllerUpdate,
  useCanalOrigemControllerActivate,
  useCanalOrigemControllerDeactivate,
} from '@/api-client';
import type { CanalOrigem } from '@/api-client/types';
import { useToast } from './useToast';

// Hook para listar todos os canais
export function useCanais() {
  return useCanalOrigemControllerFindAll({
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      select: (data): CanalOrigem[] => {
        return Array.isArray(data) ? data : [];
      },
    },
  });
}

// Hook para listar apenas canais ativos
export function useCanaisAtivos() {
  return useCanalOrigemControllerFindAll({
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      select: (data): CanalOrigem[] => {
        const canais = Array.isArray(data) ? data : [];
        return canais.filter(canal => canal.ativo);
      },
    },
  });
}

// Hook para buscar um canal específico
export function useCanal(publicId: string) {
  return useCanalOrigemControllerFindOne(publicId, {
    query: {
      enabled: !!publicId,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  });
}

// Hook para criar um novo canal
export function useCreateCanal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useCanalOrigemControllerCreate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [{ url: '/canal-origem' }] });
        toast.success('Canal criado com sucesso!');
      },
      onError: () => {
          toast.error('Erro ao criar canal');
        },
    },
  });
}

// Hook para atualizar um canal
export function useUpdateCanal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useCanalOrigemControllerUpdate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [{ url: '/canal-origem' }] });
        toast.success('Canal atualizado com sucesso!');
      },
      onError: () => {
          toast.error('Erro ao atualizar canal');
        },
    },
  });
}

// Hook para ativar um canal
export function useActivateCanal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useCanalOrigemControllerActivate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [{ url: '/canal-origem' }] });
        toast.success('Canal ativado com sucesso!');
      },
      onError: () => {
          toast.error('Erro ao ativar canal');
        },
    },
  });
}

// Hook para desativar um canal
export function useDeactivateCanal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useCanalOrigemControllerDeactivate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [{ url: '/canal-origem' }] });
        toast.success('Canal desativado com sucesso!');
      },
      onError: () => {
          toast.error('Erro ao desativar canal');
        },
    },
  });
}