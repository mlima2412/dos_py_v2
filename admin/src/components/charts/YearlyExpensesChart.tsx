"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useYearlyExpensesChart } from "@/hooks/useYearlyExpensesChart";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface YearlyExpensesChartProps {
	year?: number;
}

const chartConfig = {
	totalRealized: {
		label: "Despesas Pagas",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function YearlyExpensesChart({ year }: YearlyExpensesChartProps) {
	const { t } = useTranslation();
	const { formatCurrency } = useCurrencyFormatter();
	const { data, isLoading, error } = useYearlyExpensesChart(year);

	// Função para traduzir nomes dos meses
	const translateMonth = (monthName: string) => {
		const monthMap: { [key: string]: string } = {
			January: t("dashboard.months.january"),
			February: t("dashboard.months.february"),
			March: t("dashboard.months.march"),
			April: t("dashboard.months.april"),
			May: t("dashboard.months.may"),
			June: t("dashboard.months.june"),
			July: t("dashboard.months.july"),
			August: t("dashboard.months.august"),
			September: t("dashboard.months.september"),
			October: t("dashboard.months.october"),
			November: t("dashboard.months.november"),
			December: t("dashboard.months.december"),
		};
		return monthMap[monthName] || monthName;
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="h-6 w-48 bg-muted animate-pulse rounded" />
					<div className="h-4 w-32 bg-muted animate-pulse rounded" />
				</CardHeader>
				<CardContent>
					<div className="h-[200px] w-full bg-muted animate-pulse rounded" />
				</CardContent>
			</Card>
		);
	}

	if (error || !data || data.months.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("dashboard.expenses.paid")}</CardTitle>
					<CardDescription>{t("dashboard.noDataAvailable")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[200px] text-muted-foreground">
						{t("dashboard.noDataToDisplay")}
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = data.months.map(month => ({
		month: translateMonth(month.monthName).slice(0, 3), // Abreviar nome do mês traduzido
		totalRealized: month.totalRealized,
		fullMonth: translateMonth(month.monthName),
	}));

	const periodText =
		data.firstMonth === data.lastMonth
			? translateMonth(data.firstMonth)
			: `${translateMonth(data.firstMonth)} - ${translateMonth(data.lastMonth)}`;

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("dashboard.expenses.paid")}
					<Badge
						variant="outline"
						className="text-green-600 bg-green-600/10 border-none ml-2 items-center gap-2"
					>
						<TrendingUp className="h-4 w-4" />
						<span>{formatCurrency(data.totalRealized)}</span>
					</Badge>
				</CardTitle>
				<CardDescription>
					{periodText} {year || new Date().getFullYear()}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[200px] w-full">
					<LineChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 12,
							right: 12,
							top: 12,
							bottom: 12,
						}}
					>
						<CartesianGrid
							vertical={false}
							strokeDasharray="3 3"
							opacity={0.3}
						/>
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tick={{ fontSize: 12 }}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tick={{ fontSize: 12 }}
							tickFormatter={value => formatCurrency(value)}
						/>
						<ChartTooltip
							cursor={false}
							content={({ active, payload }) => {
								if (active && payload && payload.length) {
									const data = payload[0].payload;
									return (
										<div className="rounded-lg border bg-background p-2 shadow-md">
											<div className="grid gap-2">
												<div className="flex flex-col">
													<span className="text-[0.70rem] uppercase text-muted-foreground">
														{data.fullMonth}
													</span>
													<span className="font-bold text-foreground">
														{formatCurrency(data.totalRealized)}
													</span>
												</div>
											</div>
										</div>
									);
								}
								return null;
							}}
						/>
						<Line
							dataKey="totalRealized"
							type="monotone"
							stroke="url(#rainbowGradient)"
							dot={false}
							strokeWidth={2}
							filter="url(#rainbow-line-glow)"
						/>
						<defs>
							{/* Gradiente rainbow para a linha */}
							<linearGradient id="rainbowGradient" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stopColor="#0B84CE" stopOpacity={0.8} />
								<stop offset="20%" stopColor="#224CD1" stopOpacity={0.8} />
								<stop offset="40%" stopColor="#3A11C7" stopOpacity={0.8} />
								<stop offset="60%" stopColor="#7107C6" stopOpacity={0.8} />
								<stop offset="80%" stopColor="#C900BD" stopOpacity={0.8} />
								<stop offset="100%" stopColor="#D80155" stopOpacity={0.8} />
							</linearGradient>

							{/* Filtro de brilho para a linha rainbow */}
							<filter
								id="rainbow-line-glow"
								x="-20%"
								y="-20%"
								width="140%"
								height="140%"
							>
								<feGaussianBlur stdDeviation="10" result="blur" />
								<feComposite in="SourceGraphic" in2="blur" operator="over" />
							</filter>
						</defs>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

export default YearlyExpensesChart;
