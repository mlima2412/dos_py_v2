import { useQueryClient } from "@tanstack/react-query";
import {
	useFornecedoresControllerActivateFornecedor,
	useFornecedoresControllerDeactivateFornecedor,
	useFornecedoresControllerCreate,
	useFornecedoresControllerUpdate,
	useFornecedoresControllerFindOne,
	type FornecedoresControllerCreateMutationRequest,
	type FornecedoresControllerUpdateMutationRequest,
} from "../api-client/index";

export type CreateFornecedorData = FornecedoresControllerCreateMutationRequest;
export type UpdateFornecedorData = FornecedoresControllerUpdateMutationRequest;

export const useActivateFornecedor = () => {
	const queryClient = useQueryClient();

	return useFornecedoresControllerActivateFornecedor({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
				queryClient.invalidateQueries({ queryKey: ["fornecedores-paginated"] });
			},
		},
	});
};

export const useDeactivateFornecedor = () => {
	const queryClient = useQueryClient();

	return useFornecedoresControllerDeactivateFornecedor({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
				queryClient.invalidateQueries({ queryKey: ["fornecedores-paginated"] });
			},
		},
	});
};

export const useCreateFornecedor = () => {
	const queryClient = useQueryClient();

	return useFornecedoresControllerCreate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
				queryClient.invalidateQueries({ queryKey: ["fornecedores-paginated"] });
			},
		},
	});
};

export const useUpdateFornecedor = () => {
	const queryClient = useQueryClient();

	return useFornecedoresControllerUpdate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
				queryClient.invalidateQueries({ queryKey: ["fornecedores-paginated"] });
			},
		},
	});
};

export const useGetFornecedor = (publicId: string, parceiroId: number) => {
	return useFornecedoresControllerFindOne(
		publicId,
		{
			"x-parceiro-id": parceiroId.toString(),
		},
		{
			query: {
				enabled: !!publicId && !!parceiroId,
			},
		}
	);
};
