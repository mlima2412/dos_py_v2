import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	flexRender,
	SortingState,
} from "@tanstack/react-table";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Plus, Search, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	useFormasPagamento,
	useFormaPagamentoMutations,
} from "@/hooks/useFormasPagamento";

export const ListarFormasPagamento: React.FC = () => {
	const { t } = useTranslation("common");

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	// Hooks para dados e mutações
	const { formasPagamento, isLoading, error } = useFormasPagamento();
	const {
		ativarFormaPagamento,
		inativarFormaPagamento,
		isActivating,
		isDeactivating,
	} = useFormaPagamentoMutations();

	// Filtrar dados baseado na pesquisa
	const filteredData = useMemo(() => {
		if (!globalFilter) return formasPagamento;

		return formasPagamento.filter(method =>
			method.nome.toLowerCase().includes(globalFilter.toLowerCase())
		);
	}, [formasPagamento, globalFilter]);

	// Colunas da tabela
	const columns = useMemo(
		() => [
			{
				accessorKey: "nome",
				header: t("paymentMethods.columns.name"),
				cell: ({ getValue }: any) => (
					<div className="font-medium">{getValue()}</div>
				),
			},
			{
				accessorKey: "taxa",
				header: () => (
					<div className="text-center">{t("paymentMethods.columns.tax")}</div>
				),
				cell: ({ getValue }: any) => {
					const taxa = getValue();
					return (
						<div className="text-center">
							{taxa && !isNaN(Number(taxa))
								? `${Number(taxa).toFixed(2)}%`
								: "-"}
						</div>
					);
				},
			},
			{
				accessorKey: "impostoPosCalculo",
				header: () => (
					<div className="text-center">
						{t("paymentMethods.columns.discountApplied")}
					</div>
				),
				cell: ({ getValue }: any) => {
					const impostoPosCalculo = getValue();
					return (
						<div className="text-center">
							{impostoPosCalculo ? (
								<span className="text-green-600 font-medium">Sim</span>
							) : (
								<span className="text-gray-500">Não</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: "tempoLiberacao",
				header: () => (
					<div className="text-center">
						{t("paymentMethods.columns.daysToRelease")}
					</div>
				),
				cell: ({ getValue }: any) => {
					const dias = getValue();
					const diasNumber = Number(dias);
					return (
						<div className="text-center">
							{dias && !isNaN(diasNumber) && diasNumber > 0 ? (
								<span className="font-medium">{diasNumber} dias</span>
							) : (
								<span className="text-green-600 font-medium">Imediato</span>
							)}
						</div>
					);
				},
			},
			{
				id: "actions",
				header: t("paymentMethods.columns.actions"),
				cell: ({ row }: any) => {
					const formaPagamento = row.original;

					return (
						<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={() => handleView(formaPagamento.idFormaPag)}
								title="Visualizar"
							>
								<Eye className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={() =>
									handleToggleStatus(
										formaPagamento.idFormaPag,
										formaPagamento.ativo
									)
								}
								title={formaPagamento.ativo ? "Desativar" : "Ativar"}
								disabled={isActivating || isDeactivating}
							>
								{formaPagamento.ativo ? (
									<ToggleRight className="h-4 w-4 text-green-600" />
								) : (
									<ToggleLeft className="h-4 w-4 text-gray-400" />
								)}
							</Button>
						</div>
					);
				},
			},
		],
		[isActivating, isDeactivating]
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	// Funções de ação
	const handleView = (id: number) => {
		window.location.href = `/formaPagamento/visualizar/${id}`;
	};

	const handleToggleStatus = (id: number, isActive: boolean) => {
		if (isActive) {
			inativarFormaPagamento(id);
		} else {
			ativarFormaPagamento(id);
		}
	};

	return (
		<DashboardLayout>
			<div className="space-y-2">
				{/* Breadcrumb e Botão Criar Forma de Pagamento */}
				<div className="flex justify-between items-center">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{t("paymentMethods.title")}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Button variant="outline" size="sm" asChild>
						<Link to="/formaPagamento/criar">
							<Plus className="mr-2 h-4 w-4" />
							{t("paymentMethods.create")}
						</Link>
					</Button>
				</div>

				{/* Campo de Pesquisa */}
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t("paymentMethods.search")}
								value={globalFilter}
								onChange={e => setGlobalFilter(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
				</div>

				{/* Tabela */}
				<Card>
					<CardContent className="pt-6">
						<div className="relative">
							<ScrollArea className="h-[500px] w-full rounded-md border">
								<div className="min-w-[900px]">
									<Table className="text-sm">
										<TableHeader className="sticky top-0 bg-background z-10">
											{table.getHeaderGroups().map(headerGroup => (
												<TableRow key={headerGroup.id}>
													{headerGroup.headers.map(header => (
														<TableHead
															key={header.id}
															className="h-8 py-2 bg-background"
														>
															{header.isPlaceholder
																? null
																: flexRender(
																		header.column.columnDef.header,
																		header.getContext()
																	)}
														</TableHead>
													))}
												</TableRow>
											))}
										</TableHeader>
										<TableBody>
											{isLoading ? (
												<TableRow>
													<TableCell
														colSpan={columns.length}
														className="h-24 text-center"
													>
														{t("common.loading")}
													</TableCell>
												</TableRow>
											) : error ? (
												<TableRow>
													<TableCell
														colSpan={columns.length}
														className="h-24 text-center"
													>
														{t("common.loadError")}
													</TableCell>
												</TableRow>
											) : table.getRowModel().rows?.length ? (
												table.getRowModel().rows.map(row => (
													<TableRow
														key={row.id}
														data-state={row.getIsSelected() && "selected"}
														className="h-12 group"
													>
														{row.getVisibleCells().map(cell => (
															<TableCell key={cell.id}>
																{flexRender(
																	cell.column.columnDef.cell,
																	cell.getContext()
																)}
															</TableCell>
														))}
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell
														colSpan={columns.length}
														className="h-24 text-center"
													>
														{t("paymentMethods.noResults")}
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</ScrollArea>
						</div>

						{/* Informações de paginação */}
						<div className="flex items-center justify-between space-x-2 py-4">
							<div className="text-sm text-muted-foreground">
								{t("common.showing")} {filteredData.length} {t("common.of")}{" "}
								{formasPagamento.length} {t("common.results")}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};
