import { useMutation, useQueryClient } from "@tanstack/react-query";
import fetchClient from "@/lib/fetch-client";

/**
 * Hook para ativar um usuário
 */
export const useActivateUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (publicId: string) => {
			return await fetchClient({
				url: `/usuarios/${publicId}/ativar`,
				method: "PATCH",
			});
		},
		onSuccess: () => {
			// Invalidar o cache de usuários para atualizar a lista
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
};

/**
 * Hook para desativar um usuário
 */
export const useDeactivateUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (publicId: string) => {
			return await fetchClient({
				url: `/usuarios/${publicId}/desativar`,
				method: "PATCH",
			});
		},
		onSuccess: () => {
			// Invalidar o cache de usuários para atualizar a lista
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
};
