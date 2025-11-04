import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ArrowLeftRight,
	Search,
	Eye,
	Package,
	ListChecks,
	Printer,
} from "lucide-react";
import { useTransferenciasEstoque } from "@/hooks/useTransferenciasEstoque";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";
import { useTransferenciaEstoqueControllerMarcarComoRecebida } from "@/api-client";

export const ListarTransferencias: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();
	const { success: showSuccess, error: showError } = useToast();
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);

	const {
		data: transferencias,
		isLoading,
		error,
		refetch,
	} = useTransferenciasEstoque({
		parceiroId: selectedPartnerId ? Number(selectedPartnerId) : undefined,
		search: debouncedSearch,
	});

	// Hook para confirmar recebimento
	const confirmReceiptMutation =
		useTransferenciaEstoqueControllerMarcarComoRecebida({
			mutation: {
				onSuccess: () => {
					showSuccess(t("inventory.transfer.messages.confirmReceiptSuccess"));
					refetch();
				},
				onError: () => {
					showError(t("inventory.transfer.messages.confirmReceiptError"));
				},
			},
		});

	const handleConfirmReceipt = async (publicId: string) => {
		try {
			await confirmReceiptMutation.mutateAsync({
				publicId,
				headers: {
					"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
				},
			});
		} catch (error) {
			// Erro já tratado no onError
			console.error("Erro ao confirmar recebimento:", error);
		}
	};

	const handleViewTransferencia = (publicId: string) => {
		// Navegar para a página de visualização
		navigate(`/produtos/transferencia/visualizar/${publicId}`);
	};

	const handlePrintTransferencia = (publicId: string) => {
		// Abrir página de impressão em nova aba
		window.open(`/produtos/transferencia/print/${publicId}`, "_blank");
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const locale = i18n.language === "es" ? es : ptBR;
		return format(date, "dd/MM/yyyy HH:mm", { locale });
	};

	const getStatusBadge = (transferencia: {
		dataRecebimento?: string | null;
	}) => {
		if (transferencia.dataRecebimento) {
			return (
				<Badge
					variant="default"
					className="bg-green-100 text-green-800 border-green-200"
				>
					{t("inventory.transfer.status.received")}
				</Badge>
			);
		}
		return (
			<Badge
				variant="secondary"
				className="bg-yellow-100 text-yellow-800 border-yellow-200"
			>
				{t("inventory.transfer.status.pending")}
			</Badge>
		);
	};

	if (error) {
		return (
			
				<div className="flex items-center justify-center py-8">
					<div className="text-destructive">{t("common.loadError")}</div>
				</div>
			
		);
	}

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/inicio">
								{t("navigation.home")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/produtos">
								{t("menu.products.main")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{t("menu.products.transfers")}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Search and Create Button */}
				<div className="flex items-center gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder={t("inventory.transfer.search")}
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Button asChild>
						<Link to="/produtos/transferencia">
							<ArrowLeftRight className="h-4 w-4 mr-2" />
							{t("inventory.transfer.create")}
						</Link>
					</Button>
				</div>

				{/* Table */}
				<Card>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-muted-foreground">
									{t("common.loading")}
								</div>
							</div>
						) : transferencias?.length === 0 ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-center">
									<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">
										{t("inventory.transfer.noResults")}
									</p>
								</div>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-16">
											{t("inventory.transfer.columns.counter")}
										</TableHead>
										<TableHead>
											{t("inventory.transfer.columns.date")}
										</TableHead>
										<TableHead>
											{t("inventory.transfer.columns.source")}
										</TableHead>
										<TableHead>
											{t("inventory.transfer.columns.destination")}
										</TableHead>
										<TableHead>
											{t("inventory.transfer.columns.status")}
										</TableHead>
										<TableHead className="w-20"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{transferencias?.map((transferencia, index) => (
										<TableRow key={transferencia.id} className="group">
											<TableCell className="font-medium text-center">
												{index + 1}
											</TableCell>
											<TableCell className="font-medium">
												{formatDate(transferencia.dataTransferencia)}
											</TableCell>
											<TableCell>
												<div>
													<div className="font-medium">
														{transferencia.localOrigem.nome}
													</div>
													<div className="text-sm text-muted-foreground">
														{transferencia.localOrigem.descricao}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div>
													<div className="font-medium">
														{transferencia.localDestino.nome}
													</div>
													<div className="text-sm text-muted-foreground">
														{transferencia.localDestino.descricao}
													</div>
												</div>
											</TableCell>
											<TableCell>{getStatusBadge(transferencia)}</TableCell>
											<TableCell>
												<div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleViewTransferencia(transferencia.publicId)
														}
														className="h-8 w-8 p-0"
														title={t("inventory.transfer.actions.view")}
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handlePrintTransferencia(transferencia.publicId)
														}
														className="h-8 w-8 p-0"
														title={t("inventory.transfer.actions.print")}
													>
														<Printer className="h-4 w-4" />
													</Button>
													{!transferencia.dataRecebimento && (
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																handleConfirmReceipt(transferencia.publicId)
															}
															disabled={confirmReceiptMutation.isPending}
															className="h-8 w-8 p-0"
															title={t(
																"inventory.transfer.actions.confirmReceipt"
															)}
														>
															<ListChecks className="h-4 w-4" />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		
	);
};
