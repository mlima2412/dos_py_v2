import { useState, useMemo, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Loader2, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
	useGrupoDreControllerFindAll,
	useLancamentoDreControllerGetAnosDisponiveis,
	useLancamentoDreControllerGetMesesDisponiveis,
} from "@/api-client/hooks";
import { usePartner } from "@/hooks/usePartner";
import fetchClient from "@/lib/fetch-client";
import { useQuery } from "@tanstack/react-query";
import { GrupoDRE } from "@/api-client/types";
import { cn } from "@/lib/utils";

interface AnoDisponivel {
	ano: string;
}

interface MesDisponivel {
	mes: number;
}

interface LancamentoDRE {
	contaDreId: number;
	contaNome: string;
	grupoId: number;
	grupoNome: string;
	grupoCodigo: string;
	grupoTipo: string;
	total: number;
}

interface ResumoDRE {
	periodo: {
		dataInicio: string;
		dataFim: string;
	};
	lancamentos: LancamentoDRE[];
	totais: {
		receitas: number;
		deducoes: number;
		receitaLiquida: number;
		custos: number;
		lucroBruto: number;
		despesas: number;
		lucroOperacional: number;
	};
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("es-PY", {
		style: "currency",
		currency: "PYG",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function RelatorioDRE() {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartner();
	const [selectedYear, setSelectedYear] = useState<string>("");
	const [selectedMonth, setSelectedMonth] = useState("all");

	const { data: gruposData, isLoading: isLoadingGrupos } = useGrupoDreControllerFindAll({
		query: {
			enabled: true,
		},
	});

	// Buscar anos disponíveis
	const { data: anosDisponiveis, isLoading: isLoadingAnos } =
		useLancamentoDreControllerGetAnosDisponiveis<AnoDisponivel[]>({
			query: {
				enabled: !!selectedPartnerId,
			},
		});

	// Buscar meses disponíveis para o ano selecionado
	const { data: mesesDisponiveis, isLoading: isLoadingMeses } =
		useLancamentoDreControllerGetMesesDisponiveis<MesDisponivel[]>(parseInt(selectedYear) || 0, {
			query: {
				enabled: !!selectedPartnerId && !!selectedYear,
			},
		});

	// Selecionar o primeiro ano disponível quando carregar
	useEffect(() => {
		if (anosDisponiveis && anosDisponiveis.length > 0 && !selectedYear) {
			setSelectedYear(anosDisponiveis[0].ano);
		}
	}, [anosDisponiveis, selectedYear]);

	// Reset mês selecionado quando trocar de ano
	useEffect(() => {
		setSelectedMonth("all");
	}, [selectedYear]);

	const { dataInicio, dataFim } = useMemo(() => {
		if (!selectedYear) {
			return { dataInicio: "", dataFim: "" };
		}
		if (selectedMonth === "all") {
			return {
				dataInicio: `${selectedYear}-01-01`,
				dataFim: `${selectedYear}-12-31`,
			};
		}
		const month = selectedMonth.padStart(2, "0");
		const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
		return {
			dataInicio: `${selectedYear}-${month}-01`,
			dataFim: `${selectedYear}-${month}-${lastDay}`,
		};
	}, [selectedYear, selectedMonth]);

	const {
		data: resumoData,
		isLoading: isLoadingResumo,
		error: resumoError,
	} = useQuery({
		queryKey: ["dre-resumo", selectedPartnerId, dataInicio, dataFim],
		queryFn: async () => {
			const response = await fetchClient({
				url: `/lancamento-dre/resumo?dataInicio=${dataInicio}&dataFim=${dataFim}`,
				method: "GET",
			});
			return response.data as ResumoDRE;
		},
		enabled: !!selectedPartnerId && !!dataInicio && !!dataFim,
	});

	// Mapear nomes dos meses para tradução
	const monthNames: Record<number, string> = {
		1: t("dashboard.months.january"),
		2: t("dashboard.months.february"),
		3: t("dashboard.months.march"),
		4: t("dashboard.months.april"),
		5: t("dashboard.months.may"),
		6: t("dashboard.months.june"),
		7: t("dashboard.months.july"),
		8: t("dashboard.months.august"),
		9: t("dashboard.months.september"),
		10: t("dashboard.months.october"),
		11: t("dashboard.months.november"),
		12: t("dashboard.months.december"),
	};

	const gruposOrdenados = useMemo(() => {
		if (!gruposData) return [];
		return [...gruposData].sort((a, b) => a.ordem - b.ordem);
	}, [gruposData]);

	const lancamentosPorGrupo = useMemo(() => {
		if (!resumoData?.lancamentos) return new Map<number, LancamentoDRE[]>();
		const map = new Map<number, LancamentoDRE[]>();
		for (const lancamento of resumoData.lancamentos) {
			const existing = map.get(lancamento.grupoId) || [];
			existing.push(lancamento);
			map.set(lancamento.grupoId, existing);
		}
		return map;
	}, [resumoData]);

	const isLoading = isLoadingGrupos || isLoadingAnos || isLoadingMeses || isLoadingResumo;

	const renderGrupoRows = (grupo: GrupoDRE) => {
		const lancamentos = lancamentosPorGrupo.get(grupo.id) || [];
		const totalGrupo = lancamentos.reduce((sum, l) => sum + l.total, 0);
		const isDeducao = grupo.tipo === "DEDUCAO" || grupo.tipo === "CUSTO" || grupo.tipo === "DESPESA";

		return (
			<>
				<TableRow key={`grupo-${grupo.id}`} className="bg-muted/50 font-medium">
					<TableCell colSpan={2} className="py-2">
						<span className="text-sm font-semibold">
							{grupo.codigo} - {grupo.nome}
						</span>
					</TableCell>
					<TableCell className="text-right py-2">
						<span className={cn("font-semibold", isDeducao ? "text-red-600" : "text-green-600")}>
							{isDeducao ? "-" : ""} {formatCurrency(Math.abs(totalGrupo))}
						</span>
					</TableCell>
				</TableRow>
				{lancamentos.map(lancamento => (
					<TableRow key={`conta-${lancamento.contaDreId}`} className="text-sm">
						<TableCell className="pl-8 py-1.5">{lancamento.contaNome}</TableCell>
						<TableCell className="text-right py-1.5">
							{formatCurrency(Math.abs(lancamento.total))}
						</TableCell>
						<TableCell />
					</TableRow>
				))}
			</>
		);
	};

	const renderTotaisRow = (
		label: string,
		value: number,
		isSubtotal?: boolean,
		isHighlight?: boolean
	) => {
		const isPositive = value >= 0;
		return (
			<TableRow
				className={cn(
					isSubtotal && "bg-muted/30",
					isHighlight && "bg-primary/10 font-bold"
				)}
			>
				<TableCell colSpan={2} className={cn("py-2", isHighlight && "font-bold")}>
					{label}
				</TableCell>
				<TableCell className="text-right py-2">
					<span
						className={cn(
							"flex items-center justify-end gap-1",
							isHighlight && "font-bold text-lg",
							isPositive ? "text-green-600" : "text-red-600"
						)}
					>
						{isPositive ? (
							<TrendingUp className="h-4 w-4" />
						) : value === 0 ? (
							<Minus className="h-4 w-4" />
						) : (
							<TrendingDown className="h-4 w-4" />
						)}
						{formatCurrency(Math.abs(value))}
					</span>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<div className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="#">{t("menu.finances")}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{t("dre.title")}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("dre.title")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-wrap gap-4">
						<div className="grid gap-2 min-w-[150px]">
							<Label htmlFor="year">{t("dre.year")}</Label>
							<Select
								value={selectedYear}
								onValueChange={setSelectedYear}
								disabled={isLoadingAnos}
							>
								<SelectTrigger id="year">
									<SelectValue placeholder={t("dre.selectYear")} />
								</SelectTrigger>
								<SelectContent>
									{anosDisponiveis?.map(item => (
										<SelectItem key={item.ano} value={item.ano}>
											{item.ano}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2 min-w-[150px]">
							<Label htmlFor="month">{t("dre.month")}</Label>
							<Select
								value={selectedMonth}
								onValueChange={setSelectedMonth}
								disabled={!selectedYear || isLoadingMeses}
							>
								<SelectTrigger id="month">
									<SelectValue placeholder={t("dre.selectMonth")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("dre.allMonths")}</SelectItem>
									{mesesDisponiveis?.map(item => (
										<SelectItem key={item.mes} value={item.mes.toString()}>
											{monthNames[item.mes]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{!selectedPartnerId && (
						<p className="text-sm text-muted-foreground">{t("dre.selectPartner")}</p>
					)}

					{selectedPartnerId && !isLoadingAnos && (!anosDisponiveis || anosDisponiveis.length === 0) && (
						<div className="text-center py-8 text-muted-foreground">
							<p>{t("dre.noData")}</p>
							<p className="text-sm mt-2">{t("dre.noDataDescription")}</p>
						</div>
					)}

					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : resumoError ? (
						<div className="text-center py-8 text-muted-foreground">
							<p>{t("dre.noData")}</p>
							<p className="text-sm mt-2">{t("dre.noDataDescription")}</p>
						</div>
					) : !selectedYear ? null : (
						<div className="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[50%]">{t("dre.account")}</TableHead>
										<TableHead className="text-right w-[25%]">{t("dre.value")}</TableHead>
										<TableHead className="text-right w-[25%]">{t("dre.subtotal")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{gruposOrdenados.map(grupo => renderGrupoRows(grupo))}

									{resumoData?.totais && (
										<>
											<TableRow className="border-t-2">
												<TableCell colSpan={3} className="h-2" />
											</TableRow>
											{renderTotaisRow(
												t("dre.totals.grossRevenue"),
												resumoData.totais.receitas
											)}
											{renderTotaisRow(
												t("dre.totals.deductions"),
												-resumoData.totais.deducoes
											)}
											{renderTotaisRow(
												t("dre.totals.netRevenue"),
												resumoData.totais.receitaLiquida,
												true
											)}
											{renderTotaisRow(t("dre.totals.costs"), -resumoData.totais.custos)}
											{renderTotaisRow(
												t("dre.totals.grossProfit"),
												resumoData.totais.lucroBruto,
												true
											)}
											{renderTotaisRow(
												t("dre.totals.expenses"),
												-resumoData.totais.despesas
											)}
											{renderTotaisRow(
												t("dre.totals.operatingProfit"),
												resumoData.totais.lucroOperacional,
												false,
												true
											)}
										</>
									)}
								</TableBody>
							</Table>
						</div>
					)}

					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => window.print()}
							disabled={isLoading || !resumoData}
						>
							{t("dre.print")}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default RelatorioDRE;
