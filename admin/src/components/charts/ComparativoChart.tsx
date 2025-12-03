"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts";
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
import { TrendingUp, TrendingDown } from "lucide-react";
import { useComparativoFinanceiro } from "@/hooks/useComparativoFinanceiro";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface ComparativoChartProps {
	year?: number;
}

const chartConfig = {
	receitas: {
		label: "Receitas",
		color: "hsl(142, 76%, 36%)",
	},
	despesas: {
		label: "Despesas",
		color: "hsl(0, 84%, 60%)",
	},
} satisfies ChartConfig;

export function ComparativoChart({ year }: ComparativoChartProps) {
	const { t } = useTranslation();
	const { formatCurrency } = useCurrencyFormatter();
	const { data, isLoading, error } = useComparativoFinanceiro(year);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="h-6 w-48 bg-muted animate-pulse rounded" />
					<div className="h-4 w-32 bg-muted animate-pulse rounded" />
				</CardHeader>
				<CardContent>
					<div className="h-[300px] w-full bg-muted animate-pulse rounded" />
				</CardContent>
			</Card>
		);
	}

	if (error || !data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("comparativeDashboard.chartTitle")}</CardTitle>
					<CardDescription>{t("dashboard.noDataAvailable")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[300px] text-muted-foreground">
						{t("dashboard.noDataToDisplay")}
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = data.months.map(month => ({
		month: month.monthName.slice(0, 3),
		receitas: month.receitas,
		despesas: month.despesas,
		saldo: month.saldo,
		fullMonth: month.monthName,
	}));

	const periodText =
		data.firstMonth === data.lastMonth
			? `${data.firstMonth} ${year || new Date().getFullYear()}`
			: `${data.firstMonth} - ${data.lastMonth} ${year || new Date().getFullYear()}`;

	const isPositive = data.saldoTotal >= 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between flex-wrap gap-4">
					<div className="space-y-1.5">
						<CardTitle className="flex items-center gap-2 flex-wrap">
							{t("comparativeDashboard.chartTitle")}
							<Badge
								variant="outline"
								className={`${isPositive ? "text-green-600 bg-green-600/10" : "text-red-600 bg-red-600/10"} border-none items-center gap-2`}
							>
								{isPositive ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								<span>{formatCurrency(data.saldoTotal)}</span>
							</Badge>
						</CardTitle>
						<CardDescription>
							{periodText} · {t("comparativeDashboard.chartDescription")}
						</CardDescription>
					</div>
					<div className="flex gap-4 flex-wrap">
						<div className="text-right">
							<p className="text-xs text-muted-foreground">
								{t("comparativeDashboard.totalRevenue")}
							</p>
							<p className="text-sm font-semibold text-green-600">
								{formatCurrency(data.totalReceitas)}
							</p>
						</div>
						<div className="text-right">
							<p className="text-xs text-muted-foreground">
								{t("comparativeDashboard.totalExpenses")}
							</p>
							<p className="text-sm font-semibold text-red-600">
								{formatCurrency(data.totalDespesas)}
							</p>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[300px] w-full">
					<LineChart
						accessibilityLayer
						data={chartData}
						margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
					>
						<CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
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
									const dataPoint = payload[0].payload;
									return (
										<div className="rounded-lg border bg-background p-3 shadow-md">
											<div className="grid gap-2">
												<span className="text-sm font-medium border-b pb-1">
													{dataPoint.fullMonth}
												</span>
												<div className="flex justify-between gap-4">
													<span className="text-xs text-muted-foreground">
														{t("comparativeDashboard.revenue")}:
													</span>
													<span className="font-semibold text-green-600">
														{formatCurrency(dataPoint.receitas)}
													</span>
												</div>
												<div className="flex justify-between gap-4">
													<span className="text-xs text-muted-foreground">
														{t("comparativeDashboard.expenses")}:
													</span>
													<span className="font-semibold text-red-600">
														{formatCurrency(dataPoint.despesas)}
													</span>
												</div>
												<div className="flex justify-between gap-4 border-t pt-1">
													<span className="text-xs text-muted-foreground">
														{t("comparativeDashboard.balance")}:
													</span>
													<span
														className={`font-semibold ${dataPoint.saldo >= 0 ? "text-green-600" : "text-red-600"}`}
													>
														{formatCurrency(dataPoint.saldo)}
													</span>
												</div>
											</div>
										</div>
									);
								}
								return null;
							}}
						/>
						<Legend
							verticalAlign="top"
							height={36}
							formatter={value => {
								if (value === "receitas")
									return t("comparativeDashboard.revenue");
								if (value === "despesas")
									return t("comparativeDashboard.expenses");
								return value;
							}}
						/>
						<Line
							dataKey="receitas"
							type="monotone"
							stroke="hsl(142, 76%, 36%)"
							strokeWidth={3}
							dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4 }}
							activeDot={{ r: 6 }}
						/>
						<Line
							dataKey="despesas"
							type="monotone"
							stroke="hsl(0, 84%, 60%)"
							strokeWidth={3}
							dot={{ fill: "hsl(0, 84%, 60%)", strokeWidth: 2, r: 4 }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

export default ComparativoChart;
