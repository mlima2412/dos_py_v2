import { useMemo, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	BadgeDollarSign,
	TrendingUp,
	TrendingDown,
	Scale,
} from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { ComparativoChart } from "@/components/charts/ComparativoChart";
import { useComparativoFinanceiro } from "@/hooks/useComparativoFinanceiro";
import { useDespesasControllerListYears } from "@/api-client/hooks";
import { usePartnerContext } from "@/hooks/usePartnerContext";

export function DashboardComparativo() {
	const { t } = useTranslation();
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const { formatCurrency } = useCurrencyFormatter();
	const { selectedPartnerId } = usePartnerContext();
	const { data, isLoading, error } = useComparativoFinanceiro(selectedYear);

	// Buscar anos disponíveis da API
	const { data: yearsData } = useDespesasControllerListYears(
		{ "x-parceiro-id": Number(selectedPartnerId) },
		{
			query: {
				enabled: !!selectedPartnerId,
			},
		}
	);

	// Gerar opções de ano dinamicamente, sempre incluindo o ano atual
	const yearOptions = useMemo(() => {
		const yearsFromApi = yearsData?.map(y => parseInt(y.ano)) ?? [];
		const allYears = new Set([currentYear, ...yearsFromApi]);
		return Array.from(allYears).sort((a, b) => b - a);
	}, [yearsData, currentYear]);

	const totalReceitas = data?.totalReceitas ?? 0;
	const totalDespesas = data?.totalDespesas ?? 0;
	const saldoTotal = data?.saldoTotal ?? 0;
	const margemPercentual =
		totalReceitas > 0 ? ((saldoTotal / totalReceitas) * 100).toFixed(1) : "0";

	if (error) {
		return (
			<div className="p-6">
				<div className="text-red-500">
					{t("common.loadError")}: {error.message}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{t("comparativeDashboard.title")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<Select
					value={selectedYear.toString()}
					onValueChange={value => setSelectedYear(parseInt(value))}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder={t("comparativeDashboard.selectYear")} />
					</SelectTrigger>
					<SelectContent>
						{yearOptions.map(year => (
							<SelectItem key={year} value={year.toString()}>
								{year}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card className="relative">
					<div className="absolute top-3 right-3 p-1.5 bg-green-100 rounded-lg dark:bg-green-900">
						<TrendingUp className="w-3 h-3 text-green-600 dark:text-green-300" />
					</div>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							{t("comparativeDashboard.totalRevenue")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold text-green-600">
							{isLoading ? t("common.loading") : formatCurrency(totalReceitas)}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("comparativeDashboard.yearlyRevenue", { year: selectedYear })}
						</p>
					</CardContent>
				</Card>

				<Card className="relative">
					<div className="absolute top-3 right-3 p-1.5 bg-red-100 rounded-lg dark:bg-red-900">
						<TrendingDown className="w-3 h-3 text-red-600 dark:text-red-300" />
					</div>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							{t("comparativeDashboard.totalExpenses")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold text-red-600">
							{isLoading ? t("common.loading") : formatCurrency(totalDespesas)}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("comparativeDashboard.yearlyExpenses", { year: selectedYear })}
						</p>
					</CardContent>
				</Card>

				<Card className="relative">
					<div
						className={`absolute top-3 right-3 p-1.5 rounded-lg ${saldoTotal >= 0 ? "bg-blue-100 dark:bg-blue-900" : "bg-orange-100 dark:bg-orange-900"}`}
					>
						<BadgeDollarSign
							className={`w-3 h-3 ${saldoTotal >= 0 ? "text-blue-600 dark:text-blue-300" : "text-orange-600 dark:text-orange-300"}`}
						/>
					</div>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							{t("comparativeDashboard.balance")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-lg font-bold ${saldoTotal >= 0 ? "text-blue-600" : "text-orange-600"}`}
						>
							{isLoading ? t("common.loading") : formatCurrency(saldoTotal)}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("comparativeDashboard.yearlyBalance", { year: selectedYear })}
						</p>
					</CardContent>
				</Card>

				<Card className="relative">
					<div className="absolute top-3 right-3 p-1.5 bg-purple-100 rounded-lg dark:bg-purple-900">
						<Scale className="w-3 h-3 text-purple-600 dark:text-purple-300" />
					</div>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							{t("comparativeDashboard.profitMargin")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-lg font-bold ${parseFloat(margemPercentual) >= 0 ? "text-purple-600" : "text-orange-600"}`}
						>
							{isLoading ? t("common.loading") : `${margemPercentual}%`}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("comparativeDashboard.marginHelper")}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6">
				<ComparativoChart year={selectedYear} />
			</div>
		</div>
	);
}

export default DashboardComparativo;
