import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { usePartnerContext } from "./usePartnerContext";
import fetchClient from "@/lib/fetch-client";

export interface MonthlyComparativoData {
	month: number;
	monthName: string;
	receitas: number;
	despesas: number;
	saldo: number;
	ym: string;
}

export interface ComparativoFinanceiroData {
	months: MonthlyComparativoData[];
	firstMonth: string;
	lastMonth: string;
	totalReceitas: number;
	totalDespesas: number;
	saldoTotal: number;
}

export function useComparativoFinanceiro(year?: number) {
	const { selectedPartnerId } = usePartnerContext();
	const currentYear = year ?? new Date().getFullYear();
	const { t, i18n } = useTranslation();

	return useQuery({
		queryKey: ["comparativo-financeiro", selectedPartnerId, currentYear, i18n.language],
		queryFn: async (): Promise<ComparativoFinanceiroData> => {
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

			// Execute all requests in parallel instead of sequentially
			const monthlyPromises = months.map(async (month, i) => {
				const ym = `${currentYear}${month}`;

				// Fetch both vendas and despesas in parallel for each month
				const [vendasResult, despesasResult] = await Promise.allSettled([
					fetchClient({
						url: `/dashboard/vendas/mes?parceiroId=${selectedPartnerId}&ym=${ym}`,
						method: "GET",
					}),
					fetchClient({
						url: `/dashboard/despesas/mes?parceiroId=${selectedPartnerId}&ym=${ym}`,
						method: "GET",
					}),
				]);

				// Extract receitas from vendas result
				let receitas = 0;
				if (vendasResult.status === "fulfilled") {
					const vendasData = vendasResult.value.data as { valor_total?: string };
					receitas = parseFloat(vendasData.valor_total ?? "0");
				}

				// Extract despesas from despesas result
				let despesas = 0;
				if (despesasResult.status === "fulfilled") {
					const despesasData = despesasResult.value.data as {
						realized?: string;
						to_pay?: string;
					};
					despesas = parseFloat(despesasData.realized ?? "0");
				}

				const saldo = receitas - despesas;

				return {
					month: i + 1,
					monthName: monthNames[i],
					receitas,
					despesas,
					saldo,
					ym,
				};
			});

			// Wait for all months to be processed in parallel
			const monthlyData = await Promise.all(monthlyPromises);

			const totalReceitas = monthlyData.reduce((sum, m) => sum + m.receitas, 0);
			const totalDespesas = monthlyData.reduce((sum, m) => sum + m.despesas, 0);

			const firstNonZero = monthlyData.find(
				m => m.receitas > 0 || m.despesas > 0
			);
			const lastNonZero = [...monthlyData]
				.reverse()
				.find(m => m.receitas > 0 || m.despesas > 0);

			return {
				months: monthlyData,
				firstMonth: firstNonZero?.monthName ?? monthNames[0],
				lastMonth: lastNonZero?.monthName ?? monthNames[monthNames.length - 1],
				totalReceitas,
				totalDespesas,
				saldoTotal: totalReceitas - totalDespesas,
			};
		},
		enabled: !!selectedPartnerId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export default useComparativoFinanceiro;
