import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { usePartnerContext } from "./usePartnerContext";
import fetchClient from "@/lib/fetch-client";
// Tipos para os dados do gráfico
export interface MonthlyChartData {
	month: number; // 1-12
	monthName: string; // Nome do mês
	totalRealized: number; // Valor numérico para o gráfico
	ym: string; // YYYYMM para referência
}

export interface YearlyExpensesChartData {
	months: MonthlyChartData[];
	firstMonth: string;
	lastMonth: string;
	totalRealized: number;
}

/**
 * Hook para buscar dados mensais de despesas pagas para o gráfico anual
 */
export function useYearlyExpensesChart(year?: number) {
	const { selectedPartnerId } = usePartnerContext();
	const currentYear = year || new Date().getFullYear();
	const { t } = useTranslation();

	return useQuery({
		queryKey: ["yearly-expenses-chart", selectedPartnerId, currentYear],
		queryFn: async (): Promise<YearlyExpensesChartData> => {
			if (!selectedPartnerId) {
				throw new Error("Nenhum parceiro selecionado");
			}

			const months = [
				"01",
				"02",
				"03",
				"04",
				"05",
				"06",
				"07",
				"08",
				"09",
				"10",
				"11",
				"12",
			];
			const monthNames = [
				t("dashboard.months.january"),
				t("dashboard.months.february"),
				t("dashboard.months.march"),
				t("dashboard.months.april"),
				t("dashboard.months.may"),
				t("dashboard.months.june"),
				t("dashboard.months.july"),
				t("dashboard.months.august"),
				t("dashboard.months.september"),
				t("dashboard.months.october"),
				t("dashboard.months.november"),
				t("dashboard.months.december"),
			];

			const monthlyData: MonthlyChartData[] = [];
			let totalRealized = 0;

			// Buscar dados de cada mês
			for (let i = 0; i < months.length; i++) {
				const month = months[i];
				const ym = `${currentYear}${month}`;

				try {
					const response = await fetchClient({
						url: `/dashboard/despesas/mes?parceiroId=${selectedPartnerId}&ym=${ym}`,
						method: "GET",
					});

					const monthData = response.data as {
						realized?: string;
						to_pay?: string;
					};
					const realized = parseFloat(monthData.realized || "0");

					// Só adiciona meses com despesas pagas (totalRealized > 0)
					if (realized > 0) {
						monthlyData.push({
							month: i + 1,
							monthName: monthNames[i],
							totalRealized: realized,
							ym: ym,
						});
						totalRealized += realized;
					}
				} catch (error) {
					// Se não encontrar dados para o mês, continua silenciosamente
				}
			}

			// Determinar primeiro e último mês com dados
			const firstMonth = monthlyData.length > 0 ? monthlyData[0].monthName : "";
			const lastMonth =
				monthlyData.length > 0
					? monthlyData[monthlyData.length - 1].monthName
					: "";

			return {
				months: monthlyData,
				firstMonth,
				lastMonth,
				totalRealized,
			};
		},
		enabled: !!selectedPartnerId,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	});
}

export default useYearlyExpensesChart;
