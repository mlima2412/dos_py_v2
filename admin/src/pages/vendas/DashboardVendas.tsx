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
import { BadgeDollarSign, TrendingUp, Activity } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { YearlySalesChart } from "@/components/charts/YearlySalesChart";
import { useDashboardVendas } from "@/hooks/useDashboardVendas";

export function DashboardVendas() {
	const { t } = useTranslation();
	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const { formatCurrency } = useCurrencyFormatter();
	const { mesAtual, anoAtual, isLoading, error } =
		useDashboardVendas(selectedYear, selectedMonth);

	const yearOptions = useMemo(() => {
		const years = [currentYear, currentYear - 1, currentYear - 2];
		return years.filter((value, index) => years.indexOf(value) === index);
	}, [currentYear]);
	const monthOptions = useMemo(() => {
		const monthKeys = [
			"january",
			"february",
			"march",
			"april",
			"may",
			"june",
			"july",
			"august",
			"september",
			"october",
			"november",
			"december",
		] as const;
		return monthKeys.map((key, index) => ({
			value: (index + 1).toString(),
			label: t(`dashboard.months.${key}`),
		}));
	}, [t]);

	const parseValue = (value?: string) => Number(value ?? "0");

	const totalMes = mesAtual.data
		? formatCurrency(parseValue(mesAtual.data.valor_total))
		: formatCurrency(0);
	const totalAno = anoAtual.data
		? formatCurrency(parseValue(anoAtual.data.valor_total))
		: formatCurrency(0);
	const mediaMensal = anoAtual.data
		? formatCurrency(parseValue(anoAtual.data.media_mensal))
		: formatCurrency(0);
	const descontoMes = mesAtual.data
		? formatCurrency(parseValue(mesAtual.data.desconto_total))
		: formatCurrency(0);
	const descontoAno = anoAtual.data
		? formatCurrency(parseValue(anoAtual.data.desconto_total))
		: formatCurrency(0);

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
							<BreadcrumbPage>{t("salesDashboard.title")}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Select
						value={selectedYear.toString()}
						onValueChange={value => setSelectedYear(parseInt(value))}
					>
						<SelectTrigger className="w-40">
							<SelectValue placeholder={t("salesDashboard.selectYear")} />
						</SelectTrigger>
						<SelectContent>
							{yearOptions.map(year => (
								<SelectItem key={year} value={year.toString()}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={selectedMonth.toString()}
						onValueChange={value => setSelectedMonth(parseInt(value))}
					>
						<SelectTrigger className="w-40">
							<SelectValue placeholder={t("salesDashboard.selectMonth")} />
						</SelectTrigger>
						<SelectContent>
							{monthOptions.map(month => (
								<SelectItem key={month.value} value={month.value}>
									{month.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("salesDashboard.totalMonth")}
						</CardTitle>
						<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
							<BadgeDollarSign className="w-4 h-4 text-blue-600 dark:text-blue-300" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? t("common.loading") : totalMes}
						</div>
						<div className="flex flex-col gap-1 text-xs text-muted-foreground">
							<p>{t("salesDashboard.currentMonth")}</p>
							<p>
								{t("salesDashboard.monthlyDiscountLabel")}:{" "}
								{isLoading ? t("common.loading") : descontoMes}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("salesDashboard.totalYear")}
						</CardTitle>
						<div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900">
							<TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? t("common.loading") : totalAno}
						</div>
						<div className="flex flex-col gap-1 text-xs text-muted-foreground">
							<p>{t("salesDashboard.currentYear", { year: selectedYear })}</p>
							<p>
								{t("salesDashboard.yearlyDiscountLabel")}:{" "}
								{isLoading ? t("common.loading") : descontoAno}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("salesDashboard.monthlyAverage")}
						</CardTitle>
						<div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
							<Activity className="w-4 h-4 text-purple-600 dark:text-purple-300" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? t("common.loading") : mediaMensal}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("salesDashboard.averageHelper")}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6">
				<YearlySalesChart year={selectedYear} />
			</div>
		</div>
	);
}

export default DashboardVendas;
