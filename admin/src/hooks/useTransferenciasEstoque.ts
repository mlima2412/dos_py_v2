import { useQuery } from "@tanstack/react-query";
import { useTransferenciaEstoqueControllerFindAll } from "@/api-client";
import type { TransferenciaEstoqueResponseDto } from "@/api-client/types";

interface UseTransferenciasEstoqueParams {
	parceiroId?: number;
	search?: string;
}

export function useTransferenciasEstoque(
	params: UseTransferenciasEstoqueParams = {}
) {
	const { parceiroId, search } = params;

	const headers = {
		"x-parceiro-id": parceiroId || 0,
	};

	const query = useTransferenciaEstoqueControllerFindAll(headers, {
		query: {
			enabled: !!parceiroId,
		},
	});

	// Filtrar por busca se necessário
	const filteredData =
		query.data?.filter((transferencia: TransferenciaEstoqueResponseDto) => {
			if (!search) return true;

			const searchTerm = search.toLowerCase();
			return (
				transferencia.localOrigem.nome.toLowerCase().includes(searchTerm) ||
				transferencia.localDestino.nome.toLowerCase().includes(searchTerm) ||
				transferencia.publicId.toLowerCase().includes(searchTerm)
			);
		}) || [];

	return {
		...query,
		data: filteredData,
	};
}
