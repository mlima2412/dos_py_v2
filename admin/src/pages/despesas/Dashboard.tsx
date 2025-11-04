import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDashboardCompleto } from "@/hooks/useDashboardDespesas";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { YearlyExpensesChart } from "@/components/charts/YearlyExpensesChart";
import { ClassificationPieChart } from "@/components/charts/ClassificationPieChart";
import {
	useClassificacaoCompleta,
	convertToChartFormat,
} from "@/hooks/useDashboardClassificacao";
import {
	useCategoriaAno,
	useCategoriaMes,
	convertCategoriaForPieChart,
} from "@/hooks/useDashboardCategoria";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import {
	BadgeDollarSign,
	TrendingUp,
	TrendingDown,
	Calendar,
} from "lucide-react";

export function Dashboard() {
	const { t } = useTranslation();
	const [selectedYear, setSelectedYear] = useState<number>(
		new Date().getFullYear()
	);
	const { mesAtual, anoAtual, isLoading, error } =
		useDashboardCompleto(selectedYear);
	const { ano: classificacaoAno, mes: classificacaoMes } =
		useClassificacaoCompleta(selectedYear);
	const categoriaAno = useCategoriaAno(selectedYear);
	const categoriaMes = useCategoriaMes(selectedYear, new Date().getMonth() + 1);
	const { formatCurrency } = useCurrencyFormatter();

	// Valores formatados
	const totalMes = mesAtual.data
		? formatCurrency(
				parseFloat(mesAtual.data.realized) + parseFloat(mesAtual.data.to_pay)
			)
		: "R$ 0,00";
	const totalAno = anoAtual.data
		? formatCurrency(
				parseFloat(anoAtual.data.realized) + parseFloat(anoAtual.data.to_pay)
			)
		: "R$ 0,00";
	const pendentesMes = mesAtual.data
		? formatCurrency(parseFloat(mesAtual.data.to_pay))
		: "R$ 0,00";
	const mediaMensal = anoAtual.data
		? formatCurrency(parseFloat(anoAtual.data.average_month))
		: "R$ 0,00";

	if (error) {
		return (
			
				<div className="p-6">
					<div className="text-red-500">
						Erro ao carregar dados do dashboard: {error.message}
					</div>
				</div>
			
		);
	}

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb e Seletor de Ano */}
				<div className="flex items-center justify-between">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{t("menu.expenses.panel")}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					{/* Seletor de Ano */}
					<Select
						value={selectedYear.toString()}
						onValueChange={value => setSelectedYear(parseInt(value))}
					>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="2024">2024</SelectItem>
							<SelectItem value="2025">2025</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Cards de Resumo */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{t("expenses.dashboard.totalMonth")}
							</CardTitle>
							<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
								<BadgeDollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading ? "Carregando..." : totalMes}
							</div>
							<p className="text-xs text-muted-foreground">
								{t("expenses.dashboard.currentMonth")}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{t("expenses.dashboard.totalYear")}
							</CardTitle>
							<div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
								<TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading ? "Carregando..." : totalAno}
							</div>
							<p className="text-xs text-muted-foreground">
								{t("expenses.dashboard.currentYear")}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{t("expenses.dashboard.pending")}
							</CardTitle>
							<div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
								<Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading ? "Carregando..." : pendentesMes}
							</div>
							<p className="text-xs text-muted-foreground">
								{t("expenses.dashboard.pendingPayments")}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{t("expenses.dashboard.average")}
							</CardTitle>
							<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
								<TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading ? "Carregando..." : mediaMensal}
							</div>
							<p className="text-xs text-muted-foreground">
								{t("expenses.dashboard.monthlyAverage")}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Área de Gráficos e Informações Adicionais */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<CategoryPieChart
							title={t("expenses.dashboard.categoryDistributionYearly")}
							data={convertCategoriaForPieChart(categoriaAno.data)}
							isLoading={categoriaAno.isLoading}
							error={categoriaAno.error}
						/>
						<ClassificationPieChart
							title={t("expenses.dashboard.yearlyClassification")}
							data={convertToChartFormat(classificacaoAno.data)}
							isLoading={classificacaoAno.isLoading}
							error={classificacaoAno.error}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<CategoryPieChart
							title={t("expenses.dashboard.categoryDistributionMonthly")}
							data={convertCategoriaForPieChart(categoriaMes.data)}
							isLoading={categoriaMes.isLoading}
							error={categoriaMes.error}
						/>
						<ClassificationPieChart
							title={t("expenses.dashboard.monthlyClassification")}
							data={convertToChartFormat(classificacaoMes.data)}
							isLoading={classificacaoMes.isLoading}
							error={classificacaoMes.error}
						/>
					</div>
				</div>
				<div>
					<YearlyExpensesChart year={selectedYear} />
				</div>
			</div>
		
	);
}
