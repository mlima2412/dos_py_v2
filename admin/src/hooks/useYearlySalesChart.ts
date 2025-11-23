import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { usePartnerContext } from "./usePartnerContext";
import fetchClient from "@/lib/fetch-client";

export interface MonthlySalesChartData {
	month: number;
	monthName: string;
	totalSales: number;
	ym: string;
}

export interface YearlySalesChartData {
	months: MonthlySalesChartData[];
	firstMonth: string;
	lastMonth: string;
	totalSales: number;
}

export function useYearlySalesChart(year?: number) {
	const { selectedPartnerId } = usePartnerContext();
	const currentYear = year ?? new Date().getFullYear();
	const { t } = useTranslation();

	return useQuery({
		queryKey: ["yearly-sales-chart", selectedPartnerId, currentYear],
		queryFn: async (): Promise<YearlySalesChartData> => {
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

			const monthlyData: MonthlySalesChartData[] = [];
			let totalSales = 0;

			for (let i = 0; i < months.length; i++) {
				const ym = `${currentYear}${months[i]}`;

				const response = await fetchClient({
					url: `/dashboard/vendas/mes?parceiroId=${selectedPartnerId}&ym=${ym}`,
					method: "GET",
				});

				const payload = response.data as { valor_total?: string };
				const valorTotal = parseFloat(payload.valor_total ?? "0");

				monthlyData.push({
					month: i + 1,
					monthName: monthNames[i],
					totalSales: valorTotal,
					ym,
				});
				totalSales += valorTotal;
			}

			const firstNonZero = monthlyData.find(m => m.totalSales > 0);
			const lastNonZero = [...monthlyData]
				.reverse()
				.find(m => m.totalSales > 0);

			return {
				months: monthlyData,
				firstMonth: firstNonZero?.monthName ?? monthNames[0],
				lastMonth: lastNonZero?.monthName ?? monthNames[monthNames.length - 1],
				totalSales,
			};
		},
		enabled: !!selectedPartnerId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export default useYearlySalesChart;
