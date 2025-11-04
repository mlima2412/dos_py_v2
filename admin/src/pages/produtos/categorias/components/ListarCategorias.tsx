import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	flexRender,
	SortingState,
} from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useCategoriasProduto } from "@/hooks/useCategoriaProduto";
import { useDebounce } from "@/hooks/useDebounce";
import { LoadingMessage } from "@/components/ui/TableSkeleton";
import { useResponsiveColumns, useIsMobile } from "./ResponsiveColumns";

type ListarCategoriasProps = Record<string, never>

export const ListarCategorias: React.FC<ListarCategoriasProps> = () => {
	const { t } = useTranslation("common");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	// Debounce para busca
	const debouncedGlobalFilter = useDebounce(globalFilter, 500);

	// Buscar categorias
	const { data: categoriasData, isLoading, error } = useCategoriasProduto();

	// Filtrar dados localmente
	const data = useMemo(() => {
		if (!categoriasData) return [];

		let filtered = categoriasData;

		if (debouncedGlobalFilter) {
			filtered = categoriasData.filter(categoria =>
				categoria.descricao
					?.toLowerCase()
					.includes(debouncedGlobalFilter.toLowerCase())
			);
		}

		return filtered;
	}, [categoriasData, debouncedGlobalFilter]);

	// Detectar dispositivo móvel
	const isMobile = useIsMobile();

	// Colunas da tabela (responsivas)
	const columns = useResponsiveColumns(t, isMobile);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	return (
		<div className="space-y-4">
			{/* Campo de busca */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("productCategories.search")}
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
						<ScrollArea className="h-[400px] w-full rounded-md border">
							<div className="min-w-[600px]">
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
											<LoadingMessage
												columns={columns.length}
												message={t("productCategories.noResults")}
											/>
										)}
									</TableBody>
								</Table>
							</div>
						</ScrollArea>
					</div>

					{/* Info de resultados */}
					<div className="flex items-center justify-between space-x-2 py-4">
						<div className="text-sm text-muted-foreground">
							{t("common.showing")} {data.length} {t("common.results")}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
