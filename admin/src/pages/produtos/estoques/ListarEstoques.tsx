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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
import { Search, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useLocaisEstoque } from "@/hooks/useEstoques";
import { useParceirosAll } from "@/hooks/useParceiros";
import type { LocalEstoque } from "@/api-client/types";
import { useDebounce } from "@/hooks/useDebounce";
import { Link } from "react-router-dom";

import { LoadingMessage } from "@/components/ui/TableSkeleton";
import {
	useResponsiveColumns,
	useIsMobile,
} from "./components/ResponsiveColumns";
import { useNavigate } from "react-router-dom";

export const ListarEstoques: React.FC = () => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [parceiroFilter, setParceiroFilter] = useState<string>("all");

	// Debounce para busca
	const debouncedGlobalFilter = useDebounce(globalFilter, 500);

	// Buscar parceiros para o filtro
	const { data: parceiros } = useParceirosAll();

	// Buscar locais de estoque com scroll infinito
	const {
		data: locaisData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useLocaisEstoque({
		search: debouncedGlobalFilter,
		parceiroId: parceiroFilter !== "all" ? Number(parceiroFilter) : undefined,
	});

	// Flatten dos dados para a tabela
	const data = useMemo(() => {
		let allLocais =
			locaisData?.pages.flatMap(page => page.data || []).filter(Boolean) || [];

		// Filtrar por parceiro no frontend se necessário
		if (parceiroFilter !== "all") {
			allLocais = allLocais.filter((local: LocalEstoque) => {
				return local?.parceiroId?.toString() === parceiroFilter;
			});
		}

		return allLocais;
	}, [locaisData, parceiroFilter]);

	// Total de locais
	const total = locaisData?.pages[0]?.total || 0;

	// Detectar dispositivo móvel
	const isMobile = useIsMobile();

	// Função para imprimir etiquetas do estoque
	const handlePrintTagsStock = (stockPublicId: string, nomeLocal: string) => {
		navigate(
			`/estoques/etiquetas/${stockPublicId}/${encodeURIComponent(nomeLocal)}`
		);
	};

	// Colunas da tabela (responsivas)
	const columns = useResponsiveColumns(t, isMobile, handlePrintTagsStock);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
		manualPagination: true,
		pageCount: Math.ceil(total / 20),
	});

	// Função para carregar mais dados
	const handleLoadMore = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	return (
		
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/inicio">
									{t("navigation.home")}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{t("menu.products.stocks")}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Link to="/estoques/novo">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							{t("inventory.actions.create")}
						</Button>
					</Link>
				</div>

				{/* Filtros */}
				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder={t("inventory.search")}
									value={globalFilter}
									onChange={e => setGlobalFilter(e.target.value)}
									className="pl-8"
								/>
							</div>
							<Select value={parceiroFilter} onValueChange={setParceiroFilter}>
								<SelectTrigger className="w-full md:w-[200px]">
									<SelectValue placeholder={t("inventory.filterByPartner")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("inventory.allPartners")}
									</SelectItem>
									{parceiros?.map(parceiro => (
										<SelectItem
											key={parceiro.id}
											value={parceiro.id.toString()}
										>
											{parceiro.nome}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Tabela */}
				<Card>
					<CardContent className="pt-6">
						<div className="relative">
							<ScrollArea className="h-[500px] w-full rounded-md border">
								<div
									className={`${!isMobile ? "min-w-[800px]" : "min-w-[600px]"}`}
								>
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
													message={t("inventory.noResults")}
												/>
											)}
										</TableBody>
									</Table>
								</div>
							</ScrollArea>
						</div>

						{/* Rodapé com contador de resultados e botão de carregar mais */}
						<div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="text-sm text-muted-foreground">
								{t("common.showing")} {data.length} {t("common.of")} {total}{" "}
								{t("inventory.results")}
							</div>
							{hasNextPage && (
								<Button
									variant="outline"
									onClick={handleLoadMore}
									disabled={isFetchingNextPage}
								>
									{isFetchingNextPage
										? t("common.loading")
										: t("common.loadMore")}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		
	);
};
