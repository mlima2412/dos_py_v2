import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useSubCategoriaDespesaControllerFindAll } from "@/api-client";
import type { SubCategoriaDespesaControllerFindAll200 } from "@/api-client/types";

type SubCategoriaDespesaItem = SubCategoriaDespesaControllerFindAll200[0];
import { useSubCategoriaDespesaColumns } from "./components/columns";

const ListarSubCategoriaDespesas: React.FC = () => {
	const { t } = useTranslation();
	const [globalFilter, setGlobalFilter] = useState("");

	const {
		data: subCategorias = [],
		isLoading,
		error,
	} = useSubCategoriaDespesaControllerFindAll();

	const columns = useSubCategoriaDespesaColumns();

	const table = useReactTable({
		data: subCategorias,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			globalFilter,
		},
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: (row, _columnId, filterValue) => {
			const searchValue = filterValue.toLowerCase();
			const rowData = row.original as SubCategoriaDespesaItem;

			return (
				rowData.descricao?.toLowerCase().includes(searchValue) ||
				rowData.categoria?.descricao?.toLowerCase().includes(searchValue) ||
				rowData.idSubCategoria?.toString().includes(searchValue) ||
				false
			);
		},
	});

	if (isLoading) {
		return (
			
				<div className="flex items-center justify-center min-h-[400px]">
					<Spinner size="lg" />
				</div>
			
		);
	}

	if (error) {
		return (
			
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center">
						<p className="text-destructive mb-4">
							Erro ao carregar subcategorias
						</p>
						<Button onClick={() => window.location.reload()}>
							Tentar novamente
						</Button>
					</div>
				</div>
			
		);
	}

	return (
		
			<div className="space-y-6">
				{/* Header com Breadcrumb e Botão */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>
									{t("administration.expenseSubtypes")}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Button variant="outline" size="sm" asChild>
						<Link to="/subtipos-despesa/criar">
							<Plus className="mr-2 h-4 w-4" />
							{t("expenseSubtypes.newSubcategory")}
						</Link>
					</Button>
				</div>

				{/* Filtro de Busca */}
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t("expenseSubtypes.searchPlaceholder")}
								value={globalFilter ?? ""}
								onChange={event => setGlobalFilter(event.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
				</div>

				{/* Tabela */}
				<Card>
					<CardContent className="p-0">
						<ScrollArea className="h-[600px]">
							<Table>
								<TableHeader>
									{table.getHeaderGroups().map(headerGroup => (
										<TableRow key={headerGroup.id}>
											{headerGroup.headers.map(header => {
												return (
													<TableHead
														key={header.id}
														className={
															(
																header.column.columnDef.meta as {
																	className?: string;
																}
															)?.className
														}
													>
														{header.isPlaceholder
															? null
															: flexRender(
																	header.column.columnDef.header,
																	header.getContext()
																)}
													</TableHead>
												);
											})}
										</TableRow>
									))}
								</TableHeader>
								<TableBody>
									{table.getRowModel().rows?.length ? (
										table.getRowModel().rows.map(row => (
											<TableRow
												key={row.id}
												data-state={row.getIsSelected() && "selected"}
												className="group"
											>
												{row.getVisibleCells().map(cell => (
													<TableCell
														key={cell.id}
														className={
															(
																cell.column.columnDef.meta as {
																	className?: string;
																}
															)?.className
														}
													>
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
												{t("expenseSubtypes.noResults")}
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
		
	);
};

export default ListarSubCategoriaDespesas;
