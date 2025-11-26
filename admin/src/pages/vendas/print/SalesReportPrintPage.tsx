import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePartner } from "@/hooks/usePartner";
import fetchClient from "@/lib/fetch-client";
import SalesReportPDF from "./SalesReportLayout";
import type { SalesReportData, SalesYearData, SalesMonthData } from "./types";

export const SalesReportPrintPage: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const [searchParams] = useSearchParams();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartner();

	const [reportData, setReportData] = useState<SalesReportData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const year = searchParams.get("year");

	useEffect(() => {
		const fetchReportData = async () => {
			if (!selectedPartnerId) {
				setError("Nenhum parceiro selecionado");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);

				// Determinar quais anos buscar
				let yearsToFetch: number[] = [];
				if (year && year !== "all") {
					yearsToFetch = [parseInt(year)];
				} else {
					// Buscar lista de anos disponíveis
					const yearsResponse = await fetchClient({
						url: `/dashboard/vendas/anos?parceiroId=${selectedPartnerId}`,
						method: "GET",
					});
					yearsToFetch = (yearsResponse.data as any[]).map((y: any) => y.ano);
				}

				// Buscar dados de cada ano do Redis
				const yearGroupsPromises = yearsToFetch.map(async (yearNum) => {
					// Buscar dados mensais do ano
					const monthsData: SalesMonthData[] = [];
					let yearTotal = 0;
					let yearQuantity = 0;
					let yearDiscount = 0;
					let yearBrindes = 0;
					let yearBrindesQty = 0;

					// Buscar dados de cada mês (1-12)
					for (let month = 1; month <= 12; month++) {
						const ym = `${yearNum}${month.toString().padStart(2, "0")}`;
						try {
							const monthResponse = await fetchClient({
								url: `/dashboard/vendas/mes?parceiroId=${selectedPartnerId}&ym=${ym}`,
								method: "GET",
							});

							const monthData = monthResponse.data as any;
							const valorTotal = parseFloat(monthData.valor_total || "0");
							const quantidade = monthData.quantidade || 0;
							const descontoTotal = parseFloat(
								monthData.desconto_total || "0"
							);

							// Processar tipos de venda - extrair apenas BRINDE
							let valorBrindes = 0;
							let quantidadeBrindes = 0;

							if (monthData.tipos && Array.isArray(monthData.tipos)) {
								const brindeTipo = monthData.tipos.find((t: any) => t.tipo === "BRINDE");
								if (brindeTipo) {
									valorBrindes = parseFloat(brindeTipo.valor_total || "0");
									quantidadeBrindes = brindeTipo.quantidade || 0;
								}
							}

							// Apenas incluir meses com dados
							if (valorTotal > 0 || quantidade > 0) {
								const date = new Date(yearNum, month - 1, 1);
								monthsData.push({
									year: yearNum,
									month,
									monthName: date.toLocaleDateString(i18n.language, {
										month: "long",
									}),
									valorTotal,
									quantidade,
									descontoTotal,
									valorBrindes,
									quantidadeBrindes,
								});

								yearTotal += valorTotal;
								yearQuantity += quantidade;
								yearDiscount += descontoTotal;
								yearBrindes += valorBrindes;
								yearBrindesQty += quantidadeBrindes;
							}
						} catch (err) {
							// Mês sem dados, continuar
							console.log(`No data for ${ym}`);
						}
					}

					return {
						year: yearNum,
						months: monthsData,
						yearTotal,
						yearQuantity,
						yearDiscount,
						yearBrindes,
						yearBrindesQty,
					} as SalesYearData;
				});

				const yearGroups = await Promise.all(yearGroupsPromises);

				// Filtrar anos sem dados e ordenar
				const validYearGroups = yearGroups
					.filter((yg) => yg.months.length > 0)
					.sort((a, b) => a.year - b.year);

				// Calcular totais gerais
				const grandTotal = validYearGroups.reduce(
					(sum, yg) => sum + yg.yearTotal,
					0
				);
				const grandQuantity = validYearGroups.reduce(
					(sum, yg) => sum + yg.yearQuantity,
					0
				);
				const grandDiscount = validYearGroups.reduce(
					(sum, yg) => sum + yg.yearDiscount,
					0
				);
				const grandBrindes = validYearGroups.reduce(
					(sum, yg) => sum + yg.yearBrindes,
					0
				);
				const grandBrindesQty = validYearGroups.reduce(
					(sum, yg) => sum + yg.yearBrindesQty,
					0
				);

				const processedData: SalesReportData = {
					year: year || undefined,
					yearGroups: validYearGroups,
					grandTotal,
					grandQuantity,
					grandDiscount,
					grandBrindes,
					grandBrindesQty,
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
		year,
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
	if (!reportData || reportData.yearGroups.length === 0) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-600 mb-2">
						{t("sales.noResults")}
					</h2>
					<p className="text-gray-500">
						Nenhuma venda encontrada para o período selecionado.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-screen">
			<SalesReportPDF reportData={reportData} language={i18n.language} />
		</div>
	);
};
