import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePartner } from "@/hooks/usePartner";
import { useDebounce } from "@/hooks/useDebounce";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Trash2, Printer, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
	usePedidoCompraControllerFindAll,
	usePedidoCompraControllerRemove,
	pedidoCompraControllerFindAllQueryKey,
	useFornecedoresControllerFindActiveFornecedores,
} from "@/api-client";
import type { PedidoCompraStatusEnum, Fornecedor } from "@/api-client/types";

type OrderStatusKey = "pending" | "confirmed" | "delivered" | "cancelled";

interface PurchaseOrderListItem {
	id: number;
	publicId: string;
	supplierId: string;
	supplierName: string;
	dataPedido: string;
	valorTotal: number;
	status: OrderStatusKey;
}

const STATUS_MAP: Record<number, OrderStatusKey> = {
	1: "pending",
	2: "confirmed",
	3: "delivered",
};

const mapStatusToKey = (
	status?: PedidoCompraStatusEnum | number | null
): OrderStatusKey => {
	if (!status) return "pending";
	return STATUS_MAP[Number(status)] ?? "pending";
};

const parseCurrencyValue = (value: unknown): number => {
	if (typeof value === "number") {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	if (value && typeof value === "object") {
		const nested = (value as { value?: unknown }).value;
		if (typeof nested === "number") {
			return nested;
		}
		if (typeof nested === "string") {
			const parsed = Number(nested);
			return Number.isNaN(parsed) ? 0 : parsed;
		}
	}
	return 0;
};

// Função para formatar currency baseada no parceiro
const formatCurrency = (
	value: number,
	locale: string | null,
	isoCode: string | null
): string => {
	const currency = isoCode || "BRL";
	const localeString = locale || "pt-BR";

	return new Intl.NumberFormat(localeString, {
		style: "currency",
		currency: currency,
	}).format(value);
};

// Função para obter a cor do badge baseada no status
const getStatusBadgeVariant = (status: string) => {
	switch (status) {
		case "pending":
			return "secondary";
		case "confirmed":
			return "default";
		case "delivered":
			return "default";
		case "cancelled":
			return "destructive";
		default:
			return "secondary";
	}
};

export const ListagemPedidoCompra: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartner();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [ordersPerPage] = useState(10);
	const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

	const parceiroId = selectedPartnerId ? Number(selectedPartnerId) : null;

	const { data: pedidosData, isLoading: isLoadingOrders } =
		usePedidoCompraControllerFindAll(
			{ "x-parceiro-id": parceiroId ?? 0 },
			{
				query: {
					enabled: !!parceiroId,
				},
			}
		);

	const fornecedoresHeaders = useMemo(
		() => ({
			"x-parceiro-id": parceiroId?.toString() ?? "",
		}),
		[parceiroId]
	);

	const { data: fornecedoresData, isLoading: isLoadingFornecedores } =
		useFornecedoresControllerFindActiveFornecedores(fornecedoresHeaders, {
			query: {
				enabled: !!parceiroId,
			},
		});

	const removePedidoMutation = usePedidoCompraControllerRemove({
		mutation: {
			onSuccess: () => {
				toast.success(t("purchaseOrders.messages.deleteSuccess"));
				queryClient.invalidateQueries({
					queryKey: pedidoCompraControllerFindAllQueryKey(),
				});
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.messages.deleteError", {
						defaultValue: "Não foi possível excluir o pedido. Tente novamente.",
					})
				);
			},
			onSettled: () => {
				setDeletingOrderId(null);
			},
		},
	});

	const isLoading = isLoadingOrders || isLoadingFornecedores;

	const suppliers = useMemo(() => {
		if (!fornecedoresData) return [];
		if (!parceiroId) return fornecedoresData;
		return fornecedoresData.filter(
			(supplier: Fornecedor) => supplier.parceiroId === parceiroId
		);
	}, [fornecedoresData, parceiroId]);

	const orders = useMemo<PurchaseOrderListItem[]>(() => {
		if (!pedidosData) return [];

		return pedidosData
			.filter(order => !parceiroId || order.parceiroId === parceiroId)
			.map(order => {
				const supplierId = order.fornecedorId
					? order.fornecedorId.toString()
					: "";
				const supplierFromOrder = (order as { fornecedor?: { nome?: string } })
					.fornecedor?.nome;
				const supplierFromList = suppliers.find(
					(supplier: Fornecedor) => supplier.id === order.fornecedorId
				)?.nome;
				const supplierName = supplierFromOrder || supplierFromList || "-";

				return {
					id: order.id,
					publicId: order.publicId || order.id.toString(),
					supplierId,
					supplierName,
					dataPedido: order.dataPedido,
					valorTotal: parseCurrencyValue(order.valorTotal),
					status: mapStatusToKey(order.status),
				};
			});
	}, [pedidosData, suppliers, parceiroId]);

	// Filtrar pedidos baseado na busca e fornecedor
	const filteredOrders = useMemo(() => {
		let filtered = orders;

		if (debouncedSearchTerm) {
			const term = debouncedSearchTerm.toLowerCase();
			filtered = filtered.filter(order => {
				const orderId = order.publicId.toLowerCase();
				const supplier = order.supplierName.toLowerCase();
				return orderId.includes(term) || supplier.includes(term);
			});
		}

		if (selectedSupplier !== "all") {
			filtered = filtered.filter(
				order => order.supplierId === selectedSupplier
			);
		}

		return filtered;
	}, [orders, debouncedSearchTerm, selectedSupplier]);

	// Calcular paginação
	const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
	const startIndex = (currentPage - 1) * ordersPerPage;
	const endIndex = startIndex + ordersPerPage;
	const currentOrders = filteredOrders.slice(startIndex, endIndex);

	// Handlers
	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setCurrentPage(1); // Reset para primeira página
	};

	const handleSupplierChange = (value: string) => {
		setSelectedSupplier(value);
		setCurrentPage(1); // Reset para primeira página
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleDeleteOrder = (orderPublicId: string) => {
		if (!parceiroId) return;
		setDeletingOrderId(orderPublicId);
		removePedidoMutation.mutate({
			publicId: orderPublicId,
			headers: {
				"x-parceiro-id": parceiroId,
			},
		});
	};

	const handleViewOrder = (orderPublicId: string) => {
		navigate(`/pedidoCompra/visualizar/${orderPublicId}`);
	};

	const handlePrintOrder = (orderPublicId: string) => {
		// TODO: Implementar impressão do pedido
		console.log("Imprimir pedido:", orderPublicId);
	};

	if (!selectedPartnerId) {
		return (
			<DashboardLayout>
				<div className="text-center">
					<p className="text-muted-foreground">
						{t("common.noPartnerSelected")}
					</p>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/inicio">
								{t("purchaseOrders.breadcrumb.home")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{t("purchaseOrders.breadcrumb.purchaseOrders")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Header com busca, filtros e botão de criar */}
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
					<div className="flex flex-col sm:flex-row gap-4 flex-1">
						{/* Campo de busca */}
						<Input
							placeholder={t("purchaseOrders.search")}
							value={searchTerm}
							onChange={e => handleSearchChange(e.target.value)}
							className="w-full sm:w-80"
						/>

						{/* Filtro por fornecedor */}
						<Select
							value={selectedSupplier}
							onValueChange={handleSupplierChange}
						>
							<SelectTrigger className="w-full sm:w-60">
								<SelectValue
									placeholder={t("purchaseOrders.filters.supplier")}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("purchaseOrders.filters.allSuppliers")}
								</SelectItem>
								{suppliers.map(supplier => (
									<SelectItem key={supplier.id} value={supplier.id.toString()}>
										{supplier.nome}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Botão de criar novo pedido */}
					<Button asChild className="w-full sm:w-auto">
						<Link to="/pedidoCompra/criar">
							<Plus className="mr-2 h-4 w-4" />
							{t("purchaseOrders.create")}
						</Link>
					</Button>
				</div>

				{/* Tabela */}
				<Card>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="text-center py-8">
								<p className="text-muted-foreground">{t("common.loading")}</p>
							</div>
						) : filteredOrders.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-muted-foreground">
									{t("purchaseOrders.noResults")}
								</p>
							</div>
						) : (
							<>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												{t("purchaseOrders.columns.supplier")}
											</TableHead>
											<TableHead className="text-center">
												{t("purchaseOrders.columns.orderDate")}
											</TableHead>
											<TableHead className="text-right">
												{t("purchaseOrders.columns.purchaseValue")}
											</TableHead>
											<TableHead>
												{t("purchaseOrders.columns.status")}
											</TableHead>
											<TableHead className="w-24">
												{t("purchaseOrders.columns.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{currentOrders.map(order => (
											<TableRow key={order.publicId} className="group">
												<TableCell className="font-medium">
													{order.supplierName}
												</TableCell>
												<TableCell className="text-center">
													{order.dataPedido
														? new Date(order.dataPedido).toLocaleDateString()
														: "-"}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(
														order.valorTotal,
														selectedPartnerLocale,
														selectedPartnerIsoCode
													)}
												</TableCell>
												<TableCell>
													<Badge variant={getStatusBadgeVariant(order.status)}>
														{t(`purchaseOrders.status.${order.status}`)}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleViewOrder(order.publicId)}
															title={t("purchaseOrders.actions.view")}
														>
															<Eye className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handlePrintOrder(order.publicId)}
															title={t("purchaseOrders.actions.print")}
														>
															<Printer className="h-4 w-4" />
														</Button>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="sm"
																	title={t("purchaseOrders.actions.delete")}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		{t(
																			"purchaseOrders.messages.deleteConfirmTitle"
																		)}
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		{t(
																			"purchaseOrders.messages.deleteConfirmDescription"
																		)}
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		{t(
																			"purchaseOrders.messages.deleteConfirmCancel"
																		)}
																	</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			handleDeleteOrder(order.publicId)
																		}
																		disabled={
																			deletingOrderId === order.publicId &&
																			removePedidoMutation.isPending
																		}
																	>
																		{t(
																			"purchaseOrders.messages.deleteConfirmConfirm"
																		)}
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>

								{/* Paginação */}
								{totalPages > 1 && (
									<div className="flex items-center justify-between mt-4">
										<div className="text-sm text-muted-foreground">
											{t("purchaseOrders.pagination.showing")} {startIndex + 1}{" "}
											{t("purchaseOrders.pagination.to")}{" "}
											{Math.min(endIndex, filteredOrders.length)}{" "}
											{t("purchaseOrders.pagination.of")}{" "}
											{filteredOrders.length}{" "}
											{t("purchaseOrders.pagination.results")}
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handlePageChange(currentPage - 1)}
												disabled={currentPage === 1}
											>
												{t("purchaseOrders.pagination.previous")}
											</Button>
											<span className="text-sm">
												{t("common.page")} {currentPage} {t("common.of")}{" "}
												{totalPages}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handlePageChange(currentPage + 1)}
												disabled={currentPage === totalPages}
											>
												{t("purchaseOrders.pagination.next")}
											</Button>
										</div>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};
