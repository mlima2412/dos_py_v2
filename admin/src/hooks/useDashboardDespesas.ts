import { useQuery } from "@tanstack/react-query";
import { usePartnerContext } from "./usePartnerContext";
import fetchClient from "@/lib/fetch-client";

// Tipos para os dados de dashboard
export interface DashboardMensalData {
	parceiro_id: string;
	ym: string;
	realized: string;
	to_pay: string;
}

export interface DashboardAnualData {
	parceiro_id: string;
	year: string;
	realized: string;
	to_pay: string;
	average_month: string;
	pending_count: number;
}

/**
 * Hook para buscar dados mensais de despesas do dashboard
 */
export function useDashboardMensal(year: number, month: number) {
	const { selectedPartnerId } = usePartnerContext();

	// Formatar ano e mês como YYYYMM
	const ym = `${year}${month.toString().padStart(2, "0")}`;

	return useQuery({
		queryKey: ["dashboard", "despesas", "mensal", selectedPartnerId, ym],
		queryFn: async (): Promise<DashboardMensalData> => {
			if (!selectedPartnerId) {
				throw new Error("Nenhum parceiro selecionado");
			}

			const response = await fetchClient({
				url: `/dashboard/despesas/mes?parceiroId=${selectedPartnerId}&ym=${ym}`,
				method: "GET",
			});

			return response.data as DashboardMensalData;
		},
		enabled: !!selectedPartnerId,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	});
}

/**
 * Hook para buscar dados anuais de despesas do dashboard
 */
export function useDashboardAnual(year: number) {
	const { selectedPartnerId } = usePartnerContext();

	return useQuery({
		queryKey: ["dashboard", "despesas", "anual", selectedPartnerId, year],
		queryFn: async (): Promise<DashboardAnualData> => {
			if (!selectedPartnerId) {
				throw new Error("Nenhum parceiro selecionado");
			}

			const response = await fetchClient({
				url: `/dashboard/despesas/ano?parceiroId=${selectedPartnerId}&year=${year}`,
				method: "GET",
			});

			return response.data as DashboardAnualData;
		},
		enabled: !!selectedPartnerId,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	});
}

/**
 * Hook para buscar dados do mês atual
 */
export function useDashboardMesAtual(year?: number) {
	const now = new Date();
	const currentYear = year || now.getFullYear();
	const month = now.getMonth() + 1; // getMonth() retorna 0-11

	return useDashboardMensal(currentYear, month);
}

/**
 * Hook para buscar dados do ano atual
 */
export function useDashboardAnoAtual(year?: number) {
	const now = new Date();
	const currentYear = year || now.getFullYear();

	return useDashboardAnual(currentYear);
}

/**
 * Hook combinado que retorna todos os dados necessários para o dashboard
 */
export function useDashboardCompleto(year?: number) {
	const mesAtual = useDashboardMesAtual(year);
	const anoAtual = useDashboardAnoAtual(year);

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
