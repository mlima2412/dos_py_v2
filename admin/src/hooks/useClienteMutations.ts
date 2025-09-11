import { useQueryClient } from "@tanstack/react-query";
import {
	useClientesControllerActivate,
	useClientesControllerDeactivate,
} from "@/api-client";

/**
 * Hook para ativar um cliente
 */
export const useActivateCliente = () => {
	const queryClient = useQueryClient();

	return useClientesControllerActivate({
		mutation: {
			onSuccess: () => {
				// Invalidar o cache de clientes para atualizar a lista
				queryClient.invalidateQueries({ queryKey: ["clientes"] });
			},
		},
	});
};

/**
 * Hook para desativar um cliente
 */
export const useDeactivateCliente = () => {
	const queryClient = useQueryClient();

	return useClientesControllerDeactivate({
		mutation: {
			onSuccess: () => {
				// Invalidar o cache de clientes para atualizar a lista
				queryClient.invalidateQueries({ queryKey: ["clientes"] });
			},
		},
	});
};
