import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useDespesasControllerListYears } from "@/api-client/hooks";
import { usePartner } from "@/hooks/usePartner";
import fetchClient from "@/lib/fetch-client";

interface ExpenseReportDialogProps {
	currentYear?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ExpenseReportDialog(_props: ExpenseReportDialogProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartner();
	const [open, setOpen] = useState(false);
	const [reportType, setReportType] = useState<"sintetico" | "analitico">(
		"sintetico"
	);
	const [selectedYear, setSelectedYear] = useState<string>("all");
	const [selectedMonth, setSelectedMonth] = useState<string>("all");
	const [availableMonths, setAvailableMonths] = useState<number[]>([]);
	const [isLoadingMonths, setIsLoadingMonths] = useState(false);

	// Buscar anos disponíveis
	const { data: yearsData, isLoading: isLoadingYears } =
		useDespesasControllerListYears(
			{
				"x-parceiro-id": selectedPartnerId ? parseInt(selectedPartnerId) : 0,
			},
			{
				query: {
					enabled: !!selectedPartnerId && open,
				},
			}
		);

	const availableYears = yearsData || [];

	// Buscar meses disponíveis quando um ano é selecionado
	useEffect(() => {
		const fetchAvailableMonths = async () => {
			if (selectedYear === "all" || !selectedPartnerId || !open) {
				setAvailableMonths([]);
				return;
			}

			setIsLoadingMonths(true);
			try {
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
				const monthsWithData: number[] = [];

				// Buscar dados de cada mês para ver quais têm despesas
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

						// Se há despesas (pagas ou a pagar), adicionar o mês
						if (realized > 0 || toPay > 0) {
							monthsWithData.push(i + 1);
						}
					} catch (error) {
						// Continuar se não encontrar dados
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

		fetchAvailableMonths();
	}, [selectedYear, selectedPartnerId, open]);

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
		// Construir URL com query params
		const params = new URLSearchParams({
			reportType,
			year: selectedYear,
			month: selectedMonth,
		});

		// Navegar para a página de impressão
		navigate(`/despesas/relatorio/imprimir?${params.toString()}`);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<FileText className="h-4 w-4" />
					<span className="sr-only">
						{t("expenses.reports.generateReport")}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("expenses.reports.title")}</DialogTitle>
					<DialogDescription>
						{t("expenses.reports.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-6 py-4">
					{/* Tipo de Relatório */}
					<div className="grid gap-3">
						<Label htmlFor="report-type">
							{t("expenses.reports.reportType")}
						</Label>
						<RadioGroup
							value={reportType}
							onValueChange={(value: "sintetico" | "analitico") =>
								setReportType(value)
							}
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

					{/* Seletor de Ano */}
					<div className="grid gap-3">
						<Label htmlFor="year">{t("expenses.reports.year")}</Label>
						{isLoadingYears ? (
							<div className="flex items-center justify-center h-10">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : (
							<Select value={selectedYear} onValueChange={setSelectedYear}>
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

					{/* Seletor de Mês */}
					<div className="grid gap-3">
						<Label htmlFor="month">{t("expenses.reports.month")}</Label>
						{isLoadingMonths ? (
							<div className="flex items-center justify-center h-10">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : (
							<Select
								value={selectedMonth}
								onValueChange={setSelectedMonth}
								disabled={selectedYear === "all"}
							>
								<SelectTrigger id="month">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("expenses.reports.allMonths")}
									</SelectItem>
									{months
										.filter(month =>
											selectedYear === "all"
												? true
												: availableMonths.includes(parseInt(month.value))
										)
										.map(month => (
											<SelectItem key={month.value} value={month.value}>
												{month.label}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						)}
						{selectedYear === "all" && (
							<p className="text-xs text-muted-foreground">
								{t("expenses.reports.selectYearFirst")}
							</p>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						{t("common.cancel")}
					</Button>
					<Button onClick={handleGenerateReport}>
						<FileText className="mr-2 h-4 w-4" />
						{t("expenses.reports.generate")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
