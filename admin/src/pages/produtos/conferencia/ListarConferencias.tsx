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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertDialogWithIcon } from "@/components/ui/alert-dialog-with-icon";
import { AlertTriangle } from "lucide-react";

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
import { toast } from "react-toastify";

import {
	useConferencias,
	// useCompleteConferencia, // Removido pois não é usado
} from "@/hooks/useConferencias";
import { useConferenciaEstoqueControllerRemove } from "@/api-client/hooks/useConferenciaEstoqueControllerRemove";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useParceirosAll } from "@/hooks/useParceiros";
import type { ConferenciaEstoqueResponseDto } from "@/api-client/types";
import { useDebounce } from "@/hooks/useDebounce";
import { Link, useNavigate } from "react-router-dom";

import { LoadingMessage } from "@/components/ui/TableSkeleton";
import {
	useResponsiveColumns,
	useIsMobile,
} from "./components/ResponsiveColumns";

export const ListarConferencias: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const navigate = useNavigate();

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [parceiroFilter, setParceiroFilter] = useState<string>("all");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [conferenciaToDelete, setConferenciaToDelete] =
		useState<ConferenciaEstoqueResponseDto | null>(null);

	// Debounce para busca
	const debouncedGlobalFilter = useDebounce(globalFilter, 500);

	// Buscar parceiros para o filtro
	const { data: parceiros } = useParceirosAll();

	// Obter parceiro selecionado para headers
	const { selectedPartnerId } = usePartnerContext();

	// Buscar conferências com scroll infinito
	const {
		data: conferenciasData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useConferencias({
		search: debouncedGlobalFilter,
		parceiroId: parceiroFilter !== "all" ? Number(parceiroFilter) : undefined,
	});

	// Hook para completar conferência (comentado pois não é usado)
	// const { completeConferencia } = useCompleteConferencia();

	// Hook para eliminar conferência
	const { mutate: deleteConferencia } = useConferenciaEstoqueControllerRemove({
		mutation: {
			onSuccess: () => {
				toast.success(t("conference.messages.deleteSuccess"));
				// Recarregar dados após eliminação
				window.location.reload();
			},
			onError: () => {
				toast.error(t("conference.messages.deleteError"));
			},
		},
	});

	// Flatten dos dados para a tabela
	const data = useMemo(() => {
		const allConferencias =
			conferenciasData?.pages
				.flatMap(page => page.data || [])
				.filter(Boolean) || [];

		// Filtrar por parceiro no frontend se necessário
		// Nota: ConferenciaEstoqueResponseDto não tem parceiroId, então o filtro é feito no backend
		if (parceiroFilter !== "all") {
			// O filtro por parceiro é feito no hook useConferencias
			// Não é necessário filtrar aqui pois já vem filtrado da API
		}

		return allConferencias;
	}, [conferenciasData, parceiroFilter]);

	// Total de conferências
	const total = conferenciasData?.pages[0]?.total || 0;

	// Detectar dispositivo móvel
	const isMobile = useIsMobile();

	// Handlers para ações
	const handleView = (conferencia: ConferenciaEstoqueResponseDto) => {
		navigate(`/produtos/conferencia/visualizar/${conferencia.publicId}`);
	};

	const handleDelete = (conferencia: ConferenciaEstoqueResponseDto) => {
		if (!selectedPartnerId) {
			toast.error("Parceiro não selecionado");
			return;
		}

		const parceiroId = Number(selectedPartnerId);
		if (isNaN(parceiroId)) {
			toast.error("ID do parceiro inválido");
			return;
		}

		setConferenciaToDelete(conferencia);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (!conferenciaToDelete || !selectedPartnerId) return;

		const parceiroId = Number(selectedPartnerId);
		deleteConferencia({
			publicId: conferenciaToDelete.publicId,
			headers: {
				"x-parceiro-id": parceiroId,
			},
		});

		setDeleteDialogOpen(false);
		setConferenciaToDelete(null);
	};

	// Colunas da tabela (responsivas)
	const columns = useResponsiveColumns({
		t,
		isMobile,
		onView: handleView,
		onDelete: handleDelete,
		locale: i18n.language,
	});

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
		<DashboardLayout>
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/inicio">Início</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="/produtos">Produtos</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Conferências</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Link to="/produtos/conferencia/novo">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							{t("conference.actions.create")}
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
									placeholder={t("conference.list.search")}
									value={globalFilter}
									onChange={e => setGlobalFilter(e.target.value)}
									className="pl-8"
								/>
							</div>
							<Select value={parceiroFilter} onValueChange={setParceiroFilter}>
								<SelectTrigger className="w-full md:w-[200px]">
									<SelectValue
										placeholder={t("conference.list.filterByPartner")}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("conference.list.allPartners")}
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
													message={t("conference.messages.loadError")}
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
													message={t("conference.list.noResults")}
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
								{t("conference.list.showing")} {data.length}{" "}
								{t("conference.list.of")} {total} {t("conference.list.results")}
							</div>
							{hasNextPage && (
								<Button
									variant="outline"
									onClick={handleLoadMore}
									disabled={isFetchingNextPage}
								>
									{isFetchingNextPage
										? t("common.loading")
										: t("conference.list.loadMore")}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Dialog de confirmação de eliminação */}
				<AlertDialogWithIcon
					trigger={<div />}
					icon={<AlertTriangle className="h-6 w-6" />}
					title={t("conference.messages.deleteConfirmTitle")}
					description={t("conference.messages.deleteConfirmDescription")}
					cancelText={t("conference.messages.deleteCancelButton")}
					confirmText={t("conference.messages.deleteConfirmButton")}
					onConfirm={confirmDelete}
					variant="destructive"
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
				/>
			</div>
		</DashboardLayout>
	);
};
