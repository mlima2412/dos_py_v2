"use client";

import { LabelList, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import { ResponseErrorConfig } from "@/lib/fetch-client";
import { useTranslation } from "react-i18next";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface CategoryItemForChart {
	nome: string;
	valor: number;
}

interface CategoryPieChartProps {
	data: CategoryItemForChart[] | undefined;
	isLoading: boolean;
	error: ResponseErrorConfig | null;
	title: string;
}

const chartConfig = {
	value: {
		label: "Valor",
	},
	item1: {
		label: "Item 1",
		color: "hsl(var(--chart-1))",
	},
	item2: {
		label: "Item 2",
		color: "hsl(var(--chart-2))",
	},
	item3: {
		label: "Item 3",
		color: "hsl(var(--chart-3))",
	},
	item4: {
		label: "Item 4",
		color: "hsl(var(--chart-4))",
	},
	item5: {
		label: "Item 5",
		color: "hsl(var(--chart-5))",
	},
	item6: {
		label: "Item 6",
		color: "hsl(var(--chart-1))",
	},
	others: {
		label: "Outros",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

// Função para processar dados de categoria (similar ao processClassificacaoData)
function processCategoriaData(
	data: CategoryItemForChart[]
): CategoryItemForChart[] {
	if (!data || data.length === 0) return [];

	// Ordenar por valor decrescente
	const sortedData = [...data].sort((a, b) => b.valor - a.valor);

	// Se temos mais de 6 itens, agrupar os menores em "Outros"
	if (sortedData.length > 6) {
		const topItems = sortedData.slice(0, 5);
		const otherItems = sortedData.slice(5);
		const othersTotal = otherItems.reduce((sum, item) => sum + item.valor, 0);

		return [...topItems, { nome: "Outros", valor: othersTotal }];
	}

	return sortedData;
}

export function CategoryPieChart({
	data,
	isLoading,
	error,
	title,
}: CategoryPieChartProps) {
	const { t } = useTranslation();
	const { formatCurrency } = useCurrencyFormatter();

	if (isLoading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-sm font-medium">{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[300px]">
						<p>{t("dashboard.loading")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-sm font-medium">{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[300px]">
						<p>{t("dashboard.noDataAvailable")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-sm font-medium">{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-[300px]">
						<p>{t("dashboard.noDataAvailable")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const processedData = processCategoriaData(data);
	const chartData = processedData.map((item, index) => {
		const colorKeys = [
			"item1",
			"item2",
			"item3",
			"item4",
			"item5",
			"item6",
			"others",
		];
		const colorKey = colorKeys[index] || "others";
		return {
			name: item.nome,
			value: item.valor,
			fill:
				(
					chartConfig[colorKey as keyof typeof chartConfig] as {
						color?: string;
					}
				)?.color || "var(--chart-1)",
			percentage: (
				(item.valor / processedData.reduce((sum, d) => sum + d.valor, 0)) *
				100
			).toFixed(1),
		};
	});

	const CustomTooltipContent = ({
		active,
		payload,
	}: {
		active?: boolean;
		payload?: Array<{
			payload: { name: string; percentage: string };
			value: number;
		}>;
	}) => {
		if (active && payload && payload.length) {
			const data = payload[0];
			return (
				<div className="bg-background p-3 border rounded shadow-lg">
					<p className="font-medium">{data.payload.name}</p>
					<p className="text-primary">
						{formatCurrency(data.value)} ({data.payload.percentage}%)
					</p>
				</div>
			);
		}
		return null;
	};

	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
				>
					<PieChart>
						<ChartTooltip content={<CustomTooltipContent />} />
						<Pie
							data={chartData}
							innerRadius={30}
							dataKey="value"
							radius={10}
							cornerRadius={8}
							paddingAngle={4}
						>
							<LabelList
								dataKey="percentage"
								stroke="none"
								fontSize={12}
								fontWeight={500}
								fill="currentColor"
								formatter={(value: string) => `${value}%`}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
