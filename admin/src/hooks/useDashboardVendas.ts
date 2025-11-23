import { useQuery } from "@tanstack/react-query";
import { usePartnerContext } from "./usePartnerContext";
import fetchClient from "@/lib/fetch-client";

export interface VendaTipoResumo {
	tipo: string;
	valor_total: string;
	quantidade: number;
}

export interface DashboardVendasMensalData {
	parceiro_id: number;
	ym: string;
	valor_total: string;
	quantidade: number;
	desconto_total: string;
	desconto_count: number;
	tipos: VendaTipoResumo[];
}

export interface DashboardVendasAnualData {
	parceiro_id: number;
	year: string;
	valor_total: string;
	quantidade: number;
	media_mensal: string;
	desconto_total: string;
	desconto_count: number;
	tipos: VendaTipoResumo[];
}

function buildYm(year: number, month: number) {
	return `${year}${month.toString().padStart(2, "0")}`;
}

export function useDashboardVendasMensal(year: number, month: number) {
	const { selectedPartnerId } = usePartnerContext();
	const ym = buildYm(year, month);

	return useQuery({
		queryKey: ["dashboard", "vendas", "mensal", selectedPartnerId, ym],
		queryFn: async (): Promise<DashboardVendasMensalData> => {
			if (!selectedPartnerId) {
				throw new Error("Nenhum parceiro selecionado");
			}

			const response = await fetchClient({
				url: `/dashboard/vendas/mes?parceiroId=${selectedPartnerId}&ym=${ym}`,
				method: "GET",
			});

			return response.data as DashboardVendasMensalData;
		},
		enabled: !!selectedPartnerId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useDashboardVendasAnual(year: number) {
	const { selectedPartnerId } = usePartnerContext();

	return useQuery({
		queryKey: ["dashboard", "vendas", "anual", selectedPartnerId, year],
		queryFn: async (): Promise<DashboardVendasAnualData> => {
			if (!selectedPartnerId) {
				throw new Error("Nenhum parceiro selecionado");
			}

			const response = await fetchClient({
				url: `/dashboard/vendas/ano?parceiroId=${selectedPartnerId}&year=${year}`,
				method: "GET",
			});

			return response.data as DashboardVendasAnualData;
		},
		enabled: !!selectedPartnerId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useDashboardVendas(year?: number, month?: number) {
	const now = new Date();
	const effectiveYear = year ?? now.getFullYear();
	const effectiveMonth = month ?? now.getMonth() + 1;

	const mesAtual = useDashboardVendasMensal(effectiveYear, effectiveMonth);
	const anoAtual = useDashboardVendasAnual(effectiveYear);

	return {
		mesAtual,
		anoAtual,
		isLoading: mesAtual.isLoading || anoAtual.isLoading,
		error: mesAtual.error || anoAtual.error,
		refetch: () => {
			mesAtual.refetch();
			anoAtual.refetch();
		},
	};
}
