import {
	useClientesControllerFindOne,
	useParceirosControllerFindAll,
	useCanalOrigemControllerFindAll,
} from "@/api-client";

export const useClienteData = (id?: string, isEditing: boolean = false) => {
	const { data: cliente, isLoading: isLoadingCliente } =
		useClientesControllerFindOne(id!, {
			query: { enabled: isEditing && Boolean(id) },
		});

	const { data: parceiros = [], isLoading: isLoadingParceiros } =
		useParceirosControllerFindAll();

	const { data: canaisOrigem = [], isLoading: isLoadingCanaisOrigem } =
		useCanalOrigemControllerFindAll();

	return {
		cliente,
		parceiros,
		canaisOrigem,
		isLoadingCliente,
		isLoadingParceiros,
		isLoadingCanaisOrigem,
	};
};
