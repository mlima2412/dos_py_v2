import React, { useState, useEffect, useMemo } from "react";
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
import { Link } from "react-router-dom";

// Tipos para os dados mockados
interface MockSupplier {
	id: string;
	nome: string;
}

interface MockPurchaseOrder {
	id: string;
	fornecedorId: string;
	fornecedorNome: string;
	dataPedido: string;
	valorTotal: number;
	status: "pending" | "confirmed" | "delivered" | "cancelled";
	parceiroId: string;
}

// Dados mockados
const mockSuppliers: MockSupplier[] = [
	{ id: "1", nome: "Fornecedor ABC Ltda" },
	{ id: "2", nome: "Distribuidora XYZ S.A." },
	{ id: "3", nome: "Comercial DEF Ltda" },
	{ id: "4", nome: "Importadora GHI Ltda" },
	{ id: "5", nome: "Atacadista JKL S.A." },
];

const generateMockOrders = (parceiroId: string): MockPurchaseOrder[] => {
	const statuses: Array<"pending" | "confirmed" | "delivered" | "cancelled"> = [
		"pending",
		"confirmed",
		"delivered",
		"cancelled",
	];
	const orders: MockPurchaseOrder[] = [];

	for (let i = 1; i <= 50; i++) {
		const supplier =
			mockSuppliers[Math.floor(Math.random() * mockSuppliers.length)];
		const status = statuses[Math.floor(Math.random() * statuses.length)];
		const dataPedido = new Date();
		dataPedido.setDate(dataPedido.getDate() - Math.floor(Math.random() * 90));

		orders.push({
			id: `PO-${parceiroId}-${i.toString().padStart(3, "0")}`,
			fornecedorId: supplier.id,
			fornecedorNome: supplier.nome,
			dataPedido: dataPedido.toISOString().split("T")[0],
			valorTotal: Math.floor(Math.random() * 50000) + 1000,
			status,
			parceiroId,
		});
	}

	return orders.sort(
		(a, b) =>
			new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime()
	);
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
			return "success";
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

	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [ordersPerPage] = useState(10);
	const [mockOrders, setMockOrders] = useState<MockPurchaseOrder[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Gerar dados mockados quando o parceiro mudar
	useEffect(() => {
		if (selectedPartnerId) {
			setIsLoading(true);
			// Simular carregamento
			setTimeout(() => {
				const orders = generateMockOrders(selectedPartnerId);
				setMockOrders(orders);
				setIsLoading(false);
			}, 500);
		}
	}, [selectedPartnerId]);

	// Filtrar pedidos baseado na busca e fornecedor
	const filteredOrders = useMemo(() => {
		let filtered = mockOrders;

		// Filtrar por termo de busca (usando debouncedSearchTerm)
		if (debouncedSearchTerm) {
			filtered = filtered.filter(
				order =>
					order.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
					order.fornecedorNome
						.toLowerCase()
						.includes(debouncedSearchTerm.toLowerCase())
			);
		}

		// Filtrar por fornecedor
		if (selectedSupplier !== "all") {
			filtered = filtered.filter(
				order => order.fornecedorId === selectedSupplier
			);
		}

		return filtered;
	}, [mockOrders, debouncedSearchTerm, selectedSupplier]);

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

	const handleDeleteOrder = (orderId: string) => {
		setMockOrders(prev => prev.filter(order => order.id !== orderId));
		toast.success(t("purchaseOrders.messages.deleteSuccess"));
	};

	const handleViewOrder = (orderId: string) => {
		// TODO: Implementar visualização do pedido
		console.log("Visualizar pedido:", orderId);
	};

	const handlePrintOrder = (orderId: string) => {
		// TODO: Implementar impressão do pedido
		console.log("Imprimir pedido:", orderId);
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
								{mockSuppliers.map(supplier => (
									<SelectItem key={supplier.id} value={supplier.id}>
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
											<TableRow key={order.id} className="group">
												<TableCell className="font-medium">
													{order.fornecedorNome}
												</TableCell>
												<TableCell className="text-center">
													{new Date(order.dataPedido).toLocaleDateString()}
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
															onClick={() => handleViewOrder(order.id)}
															title={t("purchaseOrders.actions.view")}
														>
															<Eye className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handlePrintOrder(order.id)}
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
																		onClick={() => handleDeleteOrder(order.id)}
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
