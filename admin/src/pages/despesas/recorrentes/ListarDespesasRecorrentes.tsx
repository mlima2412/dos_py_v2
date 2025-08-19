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
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
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
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useDespesasRecorrentesControllerFindByParceiro } from "@/api-client/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { usePartnerContext } from "@/hooks/usePartnerContext";

import { LoadingMessage } from "@/components/ui/TableSkeleton";
import { useRecurringExpensesColumns, useIsMobile } from "./components/RecurringExpensesColumns";

export const ListarDespesasRecorrentes: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();

	const [sorting, setSorting] = useState<SortingState>([
		{ id: "diaVencimento", desc: false }, // Ordenar por dia de vencimento por padrão
	]);
	const [globalFilter, setGlobalFilter] = useState("");

	// Debounce para busca
	const debouncedGlobalFilter = useDebounce(globalFilter, 500);

	// Buscar despesas recorrentes do parceiro
	const {
		data: despesasRecorrentes,
		isLoading,
		error,
	} = useDespesasRecorrentesControllerFindByParceiro(
		Number(selectedPartnerId) || 0,
		{
			query: {
				enabled: !!selectedPartnerId,
			},
		}
	);

	// Filtrar dados baseado na busca
	const filteredData = useMemo(() => {
		if (!despesasRecorrentes || !Array.isArray(despesasRecorrentes)) {
			return [];
		}

		if (!debouncedGlobalFilter) {
			return despesasRecorrentes;
		}

		const searchTerm = debouncedGlobalFilter.toLowerCase();
		return despesasRecorrentes.filter(
			(despesa) =>
				despesa.descricao?.toLowerCase().includes(searchTerm) ||
				despesa.fornecedor?.nome?.toLowerCase().includes(searchTerm) ||
				despesa.subCategoria?.descricao?.toLowerCase().includes(searchTerm)
		);
	}, [despesasRecorrentes, debouncedGlobalFilter]);

	// Detectar dispositivo móvel
	const isMobile = useIsMobile();

	// Colunas da tabela (responsivas)
	const columns = useRecurringExpensesColumns(t, isMobile);

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
		initialState: {
			pagination: {
				pageSize: 20,
			},
		},
	});

	return (
		<DashboardLayout>
			<div className="space-y-2">
				{/* Breadcrumb e Botão Criar Despesa Recorrente */}
				<div className="flex justify-between items-center">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="/despesas">
									{t("expenses.title")}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{t("recurringExpenses.title")}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Button variant="outline" size="sm" asChild>
						<Link to="/despesas/recorrentes/novo">
							<Plus className="mr-2 h-4 w-4" />
							{t("recurringExpenses.new")}
						</Link>
					</Button>
				</div>

				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t("recurringExpenses.search")}
								value={globalFilter}
								onChange={(e) => setGlobalFilter(e.target.value)}
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
								<div
									className={`${
										!isMobile ? "min-w-[800px]" : "min-w-[600px]"
									}`}
								>
									<Table className="text-sm">
										<TableHeader className="sticky top-0 bg-background z-10">
											{table.getHeaderGroups().map((headerGroup) => (
												<TableRow key={headerGroup.id}>
													{headerGroup.headers.map((header) => (
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
												<LoadingMessage
													columns={columns.length}
													message={t("common.loading")}
												/>
											) : error ? (
												<LoadingMessage
													columns={columns.length}
													message={t("common.loadError")}
												/>
											) : table.getRowModel().rows?.length ? (
												table.getRowModel().rows.map((row) => (
													<TableRow
														key={row.id}
														data-state={row.getIsSelected() && "selected"}
														className="h-12 group"
													>
														{row.getVisibleCells().map((cell) => (
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
												<LoadingMessage
													columns={columns.length}
													message={t("expenses.recurring.noResults")}
												/>
											)}
										</TableBody>
									</Table>
								</div>
							</ScrollArea>
						</div>

						{/* Pagination Info */}
						<div className="flex items-center justify-between space-x-2 py-4">
							<div className="text-sm text-muted-foreground">
								{t("common.showing")} {filteredData.length}{" "}
								{t("expenses.recurring.results")}
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
								>
									{t("common.previous")}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
								>
									{t("common.next")}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};

export default ListarDespesasRecorrentes;