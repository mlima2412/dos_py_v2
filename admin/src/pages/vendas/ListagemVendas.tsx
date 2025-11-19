import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Plus, Search, Eye, Pencil, ArrowUpDown } from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useDebounce } from "@/hooks/useDebounce";
import { useVendaControllerPaginate } from "@/api-client";
import type { Venda } from "@/api-client/types";
interface ListagemVendasProps {
	tipo: "all" | "pedido" | "venda" | "condicional" | "parcelamento" | "brinde" | "brindePermuta";
}
export const ListagemVendas: React.FC<ListagemVendasProps> = ({ tipo }) => {
	const { t } = useTranslation("common");
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartner();
	const navigate = useNavigate();

	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const [currentPage, setCurrentPage] = useState(1);
	const [tipoVenda, setTipoVenda] = useState<string>("all");
	const [sortByCliente, setSortByCliente] = useState<"asc" | "desc" | null>(
		null
	);
	const itemsPerPage = 10;

	const parceiroId = selectedPartnerId ? Number(selectedPartnerId) : null;

	// Mapear tipo da rota para filterType da API
	const getFilterType = () => {
		if (tipo === "all") return undefined;
		if (tipo === "brinde") return "brindePermuta";
		return tipo as "pedido" | "venda" | "condicional" | "brindePermuta";
	};

	// Buscar vendas com filtros no backend
	const { data: vendasData, isLoading } = useVendaControllerPaginate(
		{ "x-parceiro-id": parceiroId ?? 0 },
		{
			page: currentPage,
			limit: itemsPerPage,
			filterType: getFilterType(),
			tipo: tipoVenda !== "all" ? tipoVenda as "DIRETA" | "CONDICIONAL" | "BRINDE" | "PERMUTA" : undefined,
			search: debouncedSearchTerm || undefined,
		},
		{
			query: {
				enabled: !!parceiroId,
			},
		}
	);

	// Ordenar vendas (filtros já aplicados no backend)
	const filteredVendas = useMemo(() => {
		if (!vendasData?.data || !Array.isArray(vendasData.data)) return [];

		const vendas = [...vendasData.data];

		// Ordenar por cliente (única operação no frontend)
		if (sortByCliente) {
			vendas.sort((a, b) => {
				const nomeA =
					`${a.clienteNome || ""} ${a.clienteSobrenome || ""}`.trim();
				const nomeB =
					`${b.clienteNome || ""} ${b.clienteSobrenome || ""}`.trim();
				return sortByCliente === "asc"
					? nomeA.localeCompare(nomeB)
					: nomeB.localeCompare(nomeA);
			});
		}

		return vendas;
	}, [vendasData, sortByCliente]);

	// Calcular paginação
	const totalItems = vendasData?.total || 0;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const currentVendas = filteredVendas;

	// Formatação de data
	const formatDate = useCallback(
		(dateString: string) => {
			if (!dateString) return "-";
			const date = new Date(dateString);
			return selectedPartnerLocale
				? date.toLocaleDateString(selectedPartnerLocale)
				: date.toLocaleDateString();
		},
		[selectedPartnerLocale]
	);

	// Formatação de moeda
	const formatCurrency = useCallback(
		(value: number | undefined) => {
			if (value === undefined || value === null) return "-";

			return new Intl.NumberFormat(selectedPartnerLocale || "pt-BR", {
				style: "currency",
				currency: selectedPartnerIsoCode || "BRL",
			}).format(value);
		},
		[selectedPartnerLocale, selectedPartnerIsoCode]
	);

	// Calcular valor total da venda (soma dos itens - desconto)
	const calculateTotal = useCallback(
		(venda: Venda) => {
			const itemsTotal =
				venda.VendaItem?.reduce((sum, item) => {
					const preco = Number(item.precoUnit) || 0;
					const quantidade = Number(item.qtdReservada) || 0;
					return sum + preco * quantidade;
				}, 0) || 0;

			const total = itemsTotal - (venda.desconto || 0);
			return formatCurrency(total);
		},
		[formatCurrency]
	);

	// Handlers
	const handleSearchChange = useCallback((value: string) => {
		setSearchTerm(value);
		setCurrentPage(1);
	}, []);

	const handleTipoChange = useCallback((value: string) => {
		setTipoVenda(value);
		setCurrentPage(1);
	}, []);

	const handleSortByCliente = useCallback(() => {
		setSortByCliente(prev =>
			prev === null ? "asc" : prev === "asc" ? "desc" : null
		);
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	const handleViewVenda = useCallback(
		(vendaPublicId: string) => {
			navigate(`/pedidoVendas/visualizar/${vendaPublicId}`);
		},
		[navigate]
	);

	const handleEditVenda = useCallback(
		(vendaPublicId: string) => {
			navigate(`/pedidoVendas/editar/${vendaPublicId}`);
		},
		[navigate]
	);

	const handleNewVenda = useCallback(() => {
		navigate("/pedidoVendas/novo");
	}, [navigate]);

	if (!selectedPartnerId) {
		return (
			<div className="text-center">
				<p className="text-muted-foreground">{t("common.noPartnerSelected")}</p>
			</div>
		);
	}

	// Determinar título da página baseado no tipo
	const getPageTitle = () => {
		switch (tipo) {
			case "pedido":
				return t("menu.openOrders");
			case "venda":
				return t("menu.completedSales");
			case "condicional":
				return t("menu.conditionals");
			case "brinde":
				return t("menu.gifts");
			case "brindePermuta":
				return t("menu.giftsAndExchanges");
			case "parcelamento":
				return t("menu.installments");
			default:
				return t("salesOrders.breadcrumb.salesOrders");
		}
	};

	return (
		<div className="space-y-6">
			{/* Breadcrumb e Botão Nova Venda */}
			<div className="flex justify-between items-center">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/inicio">
								{t("salesOrders.breadcrumb.home")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<Button onClick={handleNewVenda} size="sm">
					<Plus className="mr-2 h-4 w-4" />
					{t("salesOrders.new")}
				</Button>
			</div>

			{/* Campo de Busca e Filtros */}
			<div className="flex gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("salesOrders.search")}
							value={searchTerm}
							onChange={e => handleSearchChange(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				<Select value={tipoVenda} onValueChange={handleTipoChange}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder={t("salesOrders.selectType")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("salesOrders.types.all")}</SelectItem>
						<SelectItem value="DIRETA">
							{t("salesOrders.types.DIRETA")}
						</SelectItem>
						<SelectItem value="BRINDE">
							{t("salesOrders.types.BRINDE")}
						</SelectItem>
						<SelectItem value="CONDICIONAL">
							{t("salesOrders.types.CONDICIONAL")}
						</SelectItem>
						<SelectItem value="PERMUTA">
							{t("salesOrders.types.PERMUTA")}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tabela */}
			<Card>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">{t("common.loading")}</p>
						</div>
					) : filteredVendas.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								{t("salesOrders.noResults")}
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[100px]">
												{t("salesOrders.columns.saleId")}
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													size="sm"
													onClick={handleSortByCliente}
													className="-ml-3 h-8 data-[state=open]:bg-accent"
												>
													{t("salesOrders.columns.client")}
													<ArrowUpDown className="ml-2 h-4 w-4" />
												</Button>
											</TableHead>
											<TableHead>{t("salesOrders.columns.saleDate")}</TableHead>
											<TableHead>{t("salesOrders.columns.value")}</TableHead>
											<TableHead>{t("salesOrders.columns.discount")}</TableHead>
											<TableHead>{t("salesOrders.columns.type")}</TableHead>
											<TableHead>{t("salesOrders.columns.status")}</TableHead>
											<TableHead className="text-right w-[100px]"></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{currentVendas.map(venda => (
											<TableRow key={venda.id} className="group">
												<TableCell className="font-medium">
													#{venda.id}
												</TableCell>
												<TableCell>
													{`${venda.clienteNome || ""} ${venda.clienteSobrenome || ""}`.trim() ||
														"-"}
												</TableCell>
												<TableCell>{formatDate(venda.dataVenda)}</TableCell>
												<TableCell>{calculateTotal(venda)}</TableCell>
												<TableCell>
													{formatCurrency(venda.desconto || 0)}
												</TableCell>
												<TableCell>
													{t(`salesOrders.types.${venda.tipo}`)}
												</TableCell>
												<TableCell>
													<span
														className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
															venda.status === "CONFIRMADA" ||
															venda.status === "CONFIRMADA_TOTAL"
																? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
																: venda.status === "CONFIRMADA_PARCIAL"
																	? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
																	: venda.status === "CANCELADA"
																		? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
																		: venda.status === "ABERTA"
																			? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
																			: "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400"
														}`}
													>
														{t(`salesOrders.status.${venda.status}`)}
													</span>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleViewVenda(venda.publicId)}
															title={t("salesOrders.actions.view")}
														>
															<Eye className="h-4 w-4" />
														</Button>
														{venda.status === "PEDIDO" && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleEditVenda(venda.publicId)}
																title={t("salesOrders.actions.edit")}
															>
																<Pencil className="h-4 w-4" />
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Paginação */}
							<div className="flex items-center justify-between border-t px-6 py-4">
								<div className="text-sm text-muted-foreground">
									{t("salesOrders.pagination.showing")}{" "}
									{(currentPage - 1) * itemsPerPage + 1}{" "}
									{t("salesOrders.pagination.to")}{" "}
									{Math.min(currentPage * itemsPerPage, totalItems)}{" "}
									{t("salesOrders.pagination.of")} {totalItems}{" "}
									{t("salesOrders.pagination.results")}
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
									>
										{t("salesOrders.pagination.previous")}
									</Button>
									<div className="text-sm">
										{t("common.page")} {currentPage} {t("common.of")}{" "}
										{totalPages || 1}
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage >= totalPages}
									>
										{t("salesOrders.pagination.next")}
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
