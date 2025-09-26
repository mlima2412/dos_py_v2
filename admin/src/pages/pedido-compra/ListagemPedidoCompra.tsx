import React, { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePartner } from "@/hooks/usePartner";
import { useDebounce } from "@/hooks/useDebounce";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
    usePedidoCompraControllerFindAll,
    usePedidoCompraControllerRemove,
    pedidoCompraControllerFindAllQueryKey,
    useFornecedoresControllerFindActiveFornecedores,
    useCurrencyControllerFindAllActive,
} from "@/api-client";
import type { Fornecedor } from "@/api-client/types";
import { safeNumber } from "./utils/numberUtils";
import { formatCurrency, formatCurrencyForPartner } from "./utils/currencyUtils";
import { mapStatusToKey } from "./utils/statusUtils";
import type { PurchaseOrderListItem, OrderStatusKey } from "./types";
import { SearchAndFilterBar } from "./components/SearchAndFilterBar";
import { PurchaseOrdersTable } from "./components/PurchaseOrdersTable";
import { PaginationBar } from "./components/PaginationBar";


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

    // Carregar moedas para formatar pelo currency do pedido
    const { data: currenciesData, isLoading: isLoadingCurrencies } =
        useCurrencyControllerFindAllActive();
    const currencies = React.useMemo(() => currenciesData ?? [], [currenciesData]);

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

	const supplierOptions = useMemo(
		() =>
			suppliers
				.filter(supplier => supplier.id !== undefined && supplier.nome)
				.map(supplier => ({
					id: supplier.id!.toString(),
					nome: supplier.nome ?? "-",
				})),
		[suppliers]
	);

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
                    valorTotal: safeNumber(order.valorTotal, 0),
                    currencyId: order.currencyId,
                    cotacao: order.cotacao,
                    status: mapStatusToKey(order.status),
                };
            });
    }, [pedidosData, suppliers, parceiroId]);

    const formatPurchaseValue = useCallback(
        (order: PurchaseOrderListItem) => {
            const currency = currencies.find(c => c.id === order.currencyId);
            return formatCurrency(order.valorTotal, {
                locale: currency?.locale,
                currency: currency?.isoCode,
            });
        },
        [currencies]
    );

    const formatPayableValue = useCallback(
        (order: PurchaseOrderListItem) => {
            const totalToPay = order.valorTotal * (order.cotacao ?? 1);
            return formatCurrencyForPartner(
                totalToPay,
                selectedPartnerLocale,
                selectedPartnerIsoCode
            );
        },
        [selectedPartnerLocale, selectedPartnerIsoCode]
    );

	const formatOrderDate = useCallback(
		(value: string) => {
			if (!value) return "-";
			const date = new Date(value);
			return selectedPartnerLocale
				? date.toLocaleDateString(selectedPartnerLocale)
				: date.toLocaleDateString();
		},
		[selectedPartnerLocale]
	);

	const getStatusLabel = useCallback(
		(status: OrderStatusKey) => t(`purchaseOrders.status.${status}`),
		[t]
	);

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
	const handleSearchChange = useCallback((value: string) => {
		setSearchTerm(value);
		setCurrentPage(1);
	}, []);

	const handleSupplierChange = useCallback((value: string) => {
		setSelectedSupplier(value);
		setCurrentPage(1);
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	const handleDeleteOrder = useCallback(
		(orderPublicId: string) => {
			if (!parceiroId) return;
			setDeletingOrderId(orderPublicId);
			removePedidoMutation.mutate({
				publicId: orderPublicId,
				headers: {
					"x-parceiro-id": parceiroId,
				},
			});
		},
		[parceiroId, removePedidoMutation]
	);

	const handleViewOrder = useCallback(
		(orderPublicId: string) => {
			navigate(`/pedidoCompra/visualizar/${orderPublicId}`);
		},
		[navigate]
	);

	const handlePrintOrder = useCallback((orderPublicId: string) => {
		console.log("Imprimir pedido:", orderPublicId);
	}, []);

	const filterLabels = useMemo(
		() => ({
			searchPlaceholder: t("purchaseOrders.search"),
			supplierPlaceholder: t("purchaseOrders.filters.supplier"),
			allSuppliers: t("purchaseOrders.filters.allSuppliers"),
			createLabel: t("purchaseOrders.create"),
		}),
		[t]
	);

    const tableColumns = useMemo(
        () => ({
            supplier: t("purchaseOrders.columns.supplier"),
            orderDate: t("purchaseOrders.columns.orderDate"),
            purchaseValue: t("purchaseOrders.columns.purchaseValue"),
            payableValue: t("purchaseOrders.columns.payableValue", {
                defaultValue: "Valor a Pagar",
            }),
            status: t("purchaseOrders.columns.status"),
            actions: t("purchaseOrders.columns.actions"),
        }),
        [t]
    );

	const tableActions = useMemo(
		() => ({
			view: t("purchaseOrders.actions.view"),
			print: t("purchaseOrders.actions.print"),
			delete: t("purchaseOrders.actions.delete"),
			deleteConfirmTitle: t("purchaseOrders.messages.deleteConfirmTitle"),
			deleteConfirmDescription: t(
				"purchaseOrders.messages.deleteConfirmDescription"
			),
			deleteConfirmCancel: t("purchaseOrders.messages.deleteConfirmCancel"),
			deleteConfirmConfirm: t("purchaseOrders.messages.deleteConfirmConfirm"),
		}),
		[t]
	);

	const paginationLabels = useMemo(
		() => ({
			showing: t("purchaseOrders.pagination.showing"),
			to: t("purchaseOrders.pagination.to"),
			of: t("purchaseOrders.pagination.of"),
			results: t("purchaseOrders.pagination.results"),
			previous: t("purchaseOrders.pagination.previous"),
			next: t("purchaseOrders.pagination.next"),
			page: t("common.page"),
			ofWord: t("common.of"),
		}),
		[t]
	);

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

				<SearchAndFilterBar
					searchValue={searchTerm}
					onSearchChange={handleSearchChange}
					selectedSupplier={selectedSupplier}
					onSupplierChange={handleSupplierChange}
					suppliers={supplierOptions}
					createHref="/pedidoCompra/criar"
					labels={filterLabels}
				/>

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
                        <PurchaseOrdersTable
                            orders={currentOrders}
                            formatPurchaseValue={formatPurchaseValue}
                            formatPayableValue={formatPayableValue}
                            formatDate={formatOrderDate}
                            getStatusLabel={getStatusLabel}
                            onView={handleViewOrder}
                            onPrint={handlePrintOrder}
                            onDelete={handleDeleteOrder}
                            deletingOrderId={deletingOrderId}
                            isDeleting={removePedidoMutation.isPending}
                            columns={tableColumns}
                            actions={tableActions}
                        />
								<PaginationBar
									currentPage={currentPage}
									totalPages={totalPages}
									startIndex={startIndex}
									endIndex={endIndex}
									totalItems={filteredOrders.length}
									onPageChange={handlePageChange}
									labels={paginationLabels}
								/>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};
