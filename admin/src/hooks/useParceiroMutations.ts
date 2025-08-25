import { useQueryClient } from "@tanstack/react-query";
import {
	useParceirosControllerActivateParceiro,
	useParceirosControllerDeactivateParceiro,
	useParceirosControllerCreate,
	useParceirosControllerUpdate,
	useParceirosControllerFindOne,
	type ParceirosControllerCreateMutationRequest,
	type ParceirosControllerUpdateMutationRequest,
} from "../api-client/index";

export type CreateParceiroData = ParceirosControllerCreateMutationRequest;
export type UpdateParceiroData = ParceirosControllerUpdateMutationRequest;

export const useActivateParceiro = () => {
	const queryClient = useQueryClient();

	return useParceirosControllerActivateParceiro({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["parceiros"] });
				queryClient.invalidateQueries({ queryKey: ["parceiros-paginated"] });
			},
		},
	});
};

export const useDeactivateParceiro = () => {
	const queryClient = useQueryClient();

	return useParceirosControllerDeactivateParceiro({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["parceiros"] });
				queryClient.invalidateQueries({ queryKey: ["parceiros-paginated"] });
			},
		},
	});
};

export const useCreateParceiro = () => {
	const queryClient = useQueryClient();

	return useParceirosControllerCreate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["parceiros"] });
				queryClient.invalidateQueries({ queryKey: ["parceiros-paginated"] });
			},
		},
	});
};

export const useUpdateParceiro = () => {
	const queryClient = useQueryClient();

	return useParceirosControllerUpdate({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["parceiros"] });
				queryClient.invalidateQueries({ queryKey: ["parceiros-paginated"] });
			},
		},
	});
};

export const useGetParceiro = (publicId: string) => {
	return useParceirosControllerFindOne(publicId, {
		query: {
			enabled: !!publicId,
		},
	});
};
