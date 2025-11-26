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
import { useYearlySalesChart } from "@/hooks/useYearlySalesChart";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { SalesReportDialog } from "@/components/dialogs/SalesReportDialog";

interface YearlySalesChartProps {
	year?: number;
}

const chartConfig = {
	totalSales: {
		label: "Total de Vendas",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function YearlySalesChart({ year }: YearlySalesChartProps) {
	const { t } = useTranslation();
	const { formatCurrency } = useCurrencyFormatter();
	const { data, isLoading, error } = useYearlySalesChart(year);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="h-6 w-48 bg-muted animate-pulse rounded" />
					<div className="h-4 w-32 bg-muted animate-pulse rounded" />
				</CardHeader>
				<CardContent>
					<div className="h-[240px] w-full bg-muted animate-pulse rounded" />
				</CardContent>
			</Card>
		);
	}

	if (error || !data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("salesDashboard.lineChartTitle")}</CardTitle>
					<CardDescription>{t("dashboard.noDataAvailable")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[240px] text-muted-foreground">
						{t("dashboard.noDataToDisplay")}
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = data.months.map(month => ({
		month: month.monthName.slice(0, 3),
		totalSales: month.totalSales,
		fullMonth: month.monthName,
	}));

	const periodText =
		data.firstMonth === data.lastMonth
			? `${data.firstMonth} ${year || new Date().getFullYear()}`
			: `${data.firstMonth} - ${data.lastMonth} ${year || new Date().getFullYear()}`;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1.5">
						<CardTitle>
							{t("salesDashboard.lineChartTitle")}
							<Badge
								variant="outline"
								className="text-blue-600 bg-blue-600/10 border-none ml-2 items-center gap-2"
							>
								<TrendingUp className="h-4 w-4" />
								<span>{formatCurrency(data.totalSales)}</span>
					</Badge>
				</CardTitle>
				<CardDescription>
					{periodText} · {t("salesDashboard.lineChartDescription")}
				</CardDescription>
					</div>
					<SalesReportDialog currentYear={year || new Date().getFullYear()} />
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[240px] w-full">
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
										<div className="rounded-lg border bg-background p-2 shadow-md">
											<div className="grid gap-2">
												<div className="flex flex-col">
													<span className="text-[0.70rem] uppercase text-muted-foreground">
														{dataPoint.fullMonth}
													</span>
													<span className="font-bold text-foreground">
														{formatCurrency(dataPoint.totalSales)}
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
							dataKey="totalSales"
							type="monotone"
							stroke="url(#salesGradient)"
							strokeWidth={3}
							dot={false}
						/>
						<defs>
							<linearGradient id="salesGradient" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
								<stop offset="50%" stopColor="#7c3aed" stopOpacity={0.9} />
								<stop offset="100%" stopColor="#db2777" stopOpacity={0.9} />
							</linearGradient>
						</defs>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
