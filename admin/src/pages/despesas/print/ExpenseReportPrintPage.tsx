import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePartner } from "@/hooks/usePartner";
import fetchClient from "@/lib/fetch-client";
import ExpenseReportPDF from "./ExpenseReportLayout";
import type {
	ExpenseReportData,
	MonthGroup,
	ExpenseItem,
	YearGroup,
} from "./types";

export const ExpenseReportPrintPage: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const [searchParams] = useSearchParams();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartner();

	const [reportData, setReportData] = useState<ExpenseReportData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reportType = searchParams.get("reportType") as
		| "sintetico"
		| "analitico";
	const year = searchParams.get("year");
	const month = searchParams.get("month");

	useEffect(() => {
		const fetchReportData = async () => {
			if (!selectedPartnerId) {
				setError("Nenhum parceiro selecionado");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);

				// Construir query params
				const params = new URLSearchParams();
				if (year && year !== "all") {
					params.append("year", year);
				}
				if (month && month !== "all") {
					params.append("month", month);
				}

				// Buscar dados do relatório
				const response = await fetchClient({
					url: `/despesas/relatorio-dados?${params.toString()}`,
					method: "GET",
				});

				const expenses = response.data as any[];

				// Processar e agrupar despesas por mês
				const monthGroupsMap = new Map<string, MonthGroup>();
				let totalValue = 0;

				expenses.forEach(expense => {
					const expenseDate = new Date(expense.dataRegistro);
					const expenseYear = expenseDate.getFullYear();
					const expenseMonth = expenseDate.getMonth() + 1;
					const groupKey = `${expenseYear}-${expenseMonth}`;

					// Calcular valor total da despesa (soma de todas as parcelas)
					const expenseValue = expense.ContasPagar?.reduce(
						(total: number, conta: any) => {
							const parcelaTotal = conta.ContasPagarParcelas?.reduce(
								(sum: number, parcela: any) => {
									return sum + (parseFloat(parcela.valor) || 0);
								},
								0
							);
							return total + (parcelaTotal || 0);
						},
						0
					) || 0;

					totalValue += expenseValue;

					const expenseItem: ExpenseItem = {
						id: expense.id,
						publicId: expense.publicId,
						data: expense.dataRegistro,
						descricao: expense.descricao,
						valor: expenseValue,
						categoria:
							expense.subCategoria?.categoria?.descricao || "-",
						classificacao: expense.subCategoria?.descricao || "-",
						fornecedor: expense.fornecedor?.nome,
						moeda: {
							nome: expense.currency?.nome || "Real",
							isoCode: expense.currency?.isoCode || "BRL",
							locale: expense.currency?.locale || "pt-BR",
						},
					};

					if (!monthGroupsMap.has(groupKey)) {
						monthGroupsMap.set(groupKey, {
							year: expenseYear,
							month: expenseMonth,
							monthName: expenseDate.toLocaleDateString(i18n.language, {
								month: "long",
							}),
							expenses: [],
							subtotal: 0,
						});
					}

					const group = monthGroupsMap.get(groupKey)!;
					group.expenses.push(expenseItem);
					group.subtotal += expenseValue;
				});

				// Converter para array e ordenar por ano/mês
				const monthGroups = Array.from(monthGroupsMap.values()).sort(
					(a, b) => {
						if (a.year !== b.year) return a.year - b.year;
						return a.month - b.month;
					}
				);

				// Agrupar meses por ano
				const yearGroupsMap = new Map<number, YearGroup>();
				monthGroups.forEach(monthGroup => {
					if (!yearGroupsMap.has(monthGroup.year)) {
						yearGroupsMap.set(monthGroup.year, {
							year: monthGroup.year,
							monthGroups: [],
							yearSubtotal: 0,
						});
					}
					const yearGroup = yearGroupsMap.get(monthGroup.year)!;
					yearGroup.monthGroups.push(monthGroup);
					yearGroup.yearSubtotal += monthGroup.subtotal;
				});

				const yearGroups = Array.from(yearGroupsMap.values()).sort(
					(a, b) => a.year - b.year
				);

				const processedData: ExpenseReportData = {
					reportType: reportType || "analitico",
					year: year || undefined,
					month: month && month !== "all" ? parseInt(month) : undefined,
					yearGroups,
					totalValue,
					totalExpenses: expenses.length,
					partnerCurrency: {
						locale: selectedPartnerLocale || "pt-BR",
						isoCode: selectedPartnerIsoCode || "BRL",
					},
				};

				setReportData(processedData);
				setLoading(false);
			} catch (err) {
				console.error("Erro ao buscar dados do relatório:", err);
				setError("Erro ao carregar dados do relatório");
				setLoading(false);
			}
		};

		fetchReportData();
	}, [
		selectedPartnerId,
		reportType,
		year,
		month,
		i18n.language,
		selectedPartnerLocale,
		selectedPartnerIsoCode,
	]);

	// Tratar erros
	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">
						{t("common.loadError")}
					</h2>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	// Loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">{t("common.loading")}</p>
				</div>
			</div>
		);
	}

	// Se não há dados
	if (!reportData) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-600 mb-2">
						{t("expenses.noResults")}
					</h2>
					<p className="text-gray-500">
						Nenhuma despesa encontrada para o período selecionado.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-screen">
			<ExpenseReportPDF reportData={reportData} language={i18n.language} />
		</div>
	);
};
