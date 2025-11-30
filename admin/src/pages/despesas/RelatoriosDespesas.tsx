import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { useDespesasControllerListYears } from "@/api-client/hooks";
import { usePartner } from "@/hooks/usePartner";
import fetchClient from "@/lib/fetch-client";

export function ExpenseReportsPage() {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartner();
	const [reportType, setReportType] = useState<"sintetico" | "analitico">(
		"sintetico"
	);
	const [selectedYear, setSelectedYear] = useState("all");
	const [selectedMonth, setSelectedMonth] = useState("all");
	const [availableMonths, setAvailableMonths] = useState<number[]>([]);
	const [isLoadingMonths, setIsLoadingMonths] = useState(false);

	const { data: yearsData, isLoading: isLoadingYears } =
		useDespesasControllerListYears(
			{
				"x-parceiro-id": selectedPartnerId ? parseInt(selectedPartnerId) : 0,
			},
			{
				query: {
					enabled: !!selectedPartnerId,
				},
			}
		);

	const availableYears = yearsData || [];

	useEffect(() => {
		const fetchAvailableMonths = async () => {
			if (selectedYear === "all" || !selectedPartnerId) {
				setAvailableMonths([]);
				return;
			}

			setIsLoadingMonths(true);
			try {
				const monthsWithData: number[] = [];
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

				for (let i = 0; i < months.length; i++) {
					const month = months[i];
					const ym = `${selectedYear}${month}`;

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
						const toPay = parseFloat(monthData.to_pay || "0");

						if (realized > 0 || toPay > 0) {
							monthsWithData.push(i + 1);
						}
					} catch (error) {
						console.warn(`Dados não encontrados para ${ym}:`, error);
					}
				}

				setAvailableMonths(monthsWithData);
			} catch (error) {
				console.error("Erro ao buscar meses disponíveis:", error);
				setAvailableMonths([]);
			} finally {
				setIsLoadingMonths(false);
			}
		};

		void fetchAvailableMonths();
	}, [selectedYear, selectedPartnerId]);

	useEffect(() => {
		if (selectedYear === "all") {
			setSelectedMonth("all");
		}
	}, [selectedYear]);

	const months = [
		{ value: "1", label: t("dashboard.months.january") },
		{ value: "2", label: t("dashboard.months.february") },
		{ value: "3", label: t("dashboard.months.march") },
		{ value: "4", label: t("dashboard.months.april") },
		{ value: "5", label: t("dashboard.months.may") },
		{ value: "6", label: t("dashboard.months.june") },
		{ value: "7", label: t("dashboard.months.july") },
		{ value: "8", label: t("dashboard.months.august") },
		{ value: "9", label: t("dashboard.months.september") },
		{ value: "10", label: t("dashboard.months.october") },
		{ value: "11", label: t("dashboard.months.november") },
		{ value: "12", label: t("dashboard.months.december") },
	];

	const handleGenerateReport = () => {
		const params = new URLSearchParams({
			reportType,
			year: selectedYear,
			month: selectedMonth,
		});

		navigate(`/despesas/relatorio/imprimir?${params.toString()}`);
	};

	const isGenerateDisabled =
		!selectedPartnerId ||
		isLoadingYears ||
		(selectedYear !== "all" && !availableMonths.length && !isLoadingMonths);

	return (
		<div className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{t("menu.reports.expenses")}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("expenses.reports.title")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<p className="text-sm text-muted-foreground">
						{t("expenses.reports.description")}
					</p>

					<div className="grid gap-3">
						<Label>{t("expenses.reports.reportType")}</Label>
						<RadioGroup
							value={reportType}
							onValueChange={value =>
								setReportType(value as "sintetico" | "analitico")
							}
							className="grid gap-2"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="sintetico" id="sintetico" />
								<Label htmlFor="sintetico" className="font-normal cursor-pointer">
									{t("expenses.reports.synthetic")}
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="analitico" id="analitico" />
								<Label htmlFor="analitico" className="font-normal cursor-pointer">
									{t("expenses.reports.analytical")}
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid gap-3 max-w-xs">
						<Label htmlFor="year">{t("expenses.reports.year")}</Label>
						{isLoadingYears ? (
							<div className="flex items-center justify-center h-10">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : (
							<Select
								value={selectedYear}
								onValueChange={value => {
									setSelectedYear(value);
									if (value === "all") {
										setSelectedMonth("all");
									}
								}}
								disabled={!selectedPartnerId}
							>
								<SelectTrigger id="year">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("expenses.reports.allYears")}
									</SelectItem>
									{availableYears.map(yearItem => (
										<SelectItem key={yearItem.ano} value={yearItem.ano}>
											{yearItem.ano}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="grid gap-3 max-w-xs">
						<Label htmlFor="month">{t("expenses.reports.month")}</Label>
						{isLoadingMonths ? (
							<div className="flex items-center justify-center h-10">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : (
							<Select
								value={selectedMonth}
								onValueChange={setSelectedMonth}
								disabled={!selectedPartnerId || selectedYear === "all"}
							>
								<SelectTrigger id="month">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("expenses.reports.allMonths")}
									</SelectItem>
									{availableMonths.map(monthValue => {
										const month = months.find(
											item => item.value === monthValue.toString()
										);
										if (!month) return null;
										return (
											<SelectItem key={monthValue} value={monthValue.toString()}>
												{month.label}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						)}
					</div>

					{!selectedPartnerId && (
						<p className="text-sm text-muted-foreground">
							{t("expenses.reports.selectPartner")}
						</p>
					)}

					<Button onClick={handleGenerateReport} disabled={isGenerateDisabled}>
						{t("expenses.reports.generate")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export default ExpenseReportsPage;
