import { useQueryClient } from "@tanstack/react-query";
import {
	useCategoriaProdutoControllerFindAll,
	useCategoriaProdutoControllerFindOne,
	useCategoriaProdutoControllerCreate,
	useCategoriaProdutoControllerUpdate,
	useCategoriaProdutoControllerRemove,
} from "@/api-client";
import type {
	CategoriaProdutoControllerFindAll200,
	CategoriaProdutoControllerCreateMutationRequest,
	CategoriaProdutoControllerUpdateMutationRequest,
} from "@/api-client/types";
import { useToast } from "./useToast";

// Hook para listar todas as categorias
export function useCategoriasProduto() {
	return useCategoriaProdutoControllerFindAll({
		query: {
			staleTime: 5 * 60 * 1000, // 5 minutos
			select: (data): CategoriaProdutoControllerFindAll200 => {
				return Array.isArray(data) ? data : [];
			},
		},
	});
}

// Hook para buscar uma categoria específica
export function useCategoriaProduto(id: number) {
	return useCategoriaProdutoControllerFindOne(id, {
		query: {
			enabled: !!id,
		},
	});
}

// Hook para criar categoria
export function useCreateCategoriaProduto() {
	const queryClient = useQueryClient();
	const toast = useToast();

	return useCategoriaProdutoControllerCreate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [{ url: "/categoria-produto" }],
				});
				toast.success("Categoria criada com sucesso!");
			},
			onError: error => {
				console.error("Erro ao criar categoria:", error);
				toast.error("Erro ao criar categoria. Tente novamente.");
			},
		},
	});
}

// Hook para atualizar categoria
export function useUpdateCategoriaProduto() {
	const queryClient = useQueryClient();
	const toast = useToast();

	return useCategoriaProdutoControllerUpdate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [{ url: "/categoria-produto" }],
				});
				toast.success("Categoria atualizada com sucesso!");
			},
			onError: () => {
				toast.error("Erro ao atualizar categoria. Tente novamente.");
			},
		},
	});
}

// Hook para excluir categoria
export function useDeleteCategoriaProduto() {
	const queryClient = useQueryClient();
	const toast = useToast();

	return useCategoriaProdutoControllerRemove({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [{ url: "/categoria-produto" }],
				});
				toast.success("Categoria excluída com sucesso!");
			},
			onError: error => {
				console.error("Erro ao excluir categoria:", error);
				toast.error("Erro ao excluir categoria. Tente novamente.");
			},
		},
	});
}

// Hook para gerenciar formulário de categoria
export function useCategoriaProdutoForm() {
	const createMutation = useCreateCategoriaProduto();
	const updateMutation = useUpdateCategoriaProduto();

	const createCategoria = (
		data: CategoriaProdutoControllerCreateMutationRequest
	) => {
		return createMutation.mutate({ data });
	};

	const updateCategoria = (
		id: number,
		data: CategoriaProdutoControllerUpdateMutationRequest
	) => {
		return updateMutation.mutate({ id, data });
	};

	return {
		createCategoria,
		updateCategoria,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isLoading: createMutation.isPending || updateMutation.isPending,
	};
}
