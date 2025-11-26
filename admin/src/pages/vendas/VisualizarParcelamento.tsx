import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import CurrencyInput from "react-currency-input-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, CheckCircle2 } from "lucide-react";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useParcelamentoControllerFindOne,
	useParcelamentoControllerFindParcelas,
	useParcelamentoControllerMarcarParcelaPaga,
	useParcelamentoControllerCriarParcelaEspontanea,
	parcelamentoControllerFindOneQueryKey,
	parcelamentoControllerFindParcelasQueryKey,
} from "@/api-client";
import { useQueryClient } from "@tanstack/react-query";

export const VisualizarParcelamento: React.FC = () => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartnerContext();

	const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
	const [isSpontaneousPaymentOpen, setIsSpontaneousPaymentOpen] =
		useState(false);
	const [selectedParcelaId, setSelectedParcelaId] = useState<number | null>(
		null
	);
	const [paymentValue, setPaymentValue] = useState("");

	const parceiroId = selectedPartnerId ? Number(selectedPartnerId) : 0;
	const parceiroHeaderId = parceiroId ? parceiroId.toString() : "";
	const parcelamentoId = id ? Number(id) : 0;

	// Buscar parcelamento
	const { data: parcelamento, isLoading: isLoadingParcelamento } =
		useParcelamentoControllerFindOne(parcelamentoId, {
			query: {
				enabled: !!parcelamentoId,
			},
		});

	// Buscar parcelas
	const { data: parcelas, isLoading: isLoadingParcelas } =
		useParcelamentoControllerFindParcelas(
			parcelamentoId,
			{ "x-parceiro-id": parceiroHeaderId },
			{
				query: {
					enabled: !!parcelamentoId && !!parceiroId,
				},
			}
		);

	// Mutações
	const marcarPagaMutation = useParcelamentoControllerMarcarParcelaPaga();
	const criarEspontaneaMutation =
		useParcelamentoControllerCriarParcelaEspontanea();

	// Handlers
	const handleBack = useCallback(() => {
		navigate("/pedidoVendas/parcelamentos");
	}, [navigate]);

	const handleMarcarPaga = useCallback((parcelaId: number) => {
		setSelectedParcelaId(parcelaId);
		setIsPayDialogOpen(true);
	}, []);

	const confirmMarcarPaga = useCallback(async () => {
		if (!selectedParcelaId) return;

		try {
			await marcarPagaMutation.mutateAsync({
				parcelaId: selectedParcelaId,
				headers: { "x-parceiro-id": parceiroHeaderId },
				data: {},
			});

			toast.success(t("installments.messages.parcelaPagaSuccess"));
			setIsPayDialogOpen(false);
			setSelectedParcelaId(null);

			// Atualizar dados
			await queryClient.invalidateQueries({
				queryKey: parcelamentoControllerFindParcelasQueryKey(parcelamentoId),
			});
			await queryClient.invalidateQueries({
				queryKey: parcelamentoControllerFindOneQueryKey(parcelamentoId),
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t("installments.messages.parcelaPagaError");
			toast.error(errorMessage);
		}
	}, [
		selectedParcelaId,
		parceiroId,
		marcarPagaMutation,
		queryClient,
		t,
	]);

	const handleSpontaneousPayment = useCallback(() => {
		setPaymentValue("");
		setIsSpontaneousPaymentOpen(true);
	}, []);

	const confirmSpontaneousPayment = useCallback(async () => {
		const valor = parseFloat(paymentValue);

		if (!valor || valor <= 0) {
			toast.error(t("installments.messages.valorInvalido"));
			return;
		}

		try {
			await criarEspontaneaMutation.mutateAsync({
				id: parcelamentoId,
				headers: { "x-parceiro-id": parceiroHeaderId },
				data: { valor },
			});

			toast.success(t("installments.messages.parcelaCriadaSuccess"));
			setIsSpontaneousPaymentOpen(false);
			setPaymentValue("");

			// Atualizar dados
			await queryClient.invalidateQueries({
				queryKey: parcelamentoControllerFindParcelasQueryKey(parcelamentoId),
			});
			await queryClient.invalidateQueries({
				queryKey: parcelamentoControllerFindOneQueryKey(parcelamentoId),
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t("installments.messages.parcelaCriadaError");
			toast.error(errorMessage);
		}
	}, [
		paymentValue,
		parcelamentoId,
		parceiroId,
		criarEspontaneaMutation,
		queryClient,
		t,
	]);

	// Format helpers
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

	const formatDate = useCallback(
		(dateString: Date | string | null) => {
			if (!dateString) return "-";
			const date = new Date(dateString);
			return selectedPartnerLocale
				? date.toLocaleDateString(selectedPartnerLocale)
				: date.toLocaleDateString();
		},
		[selectedPartnerLocale]
	);

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case "PAGO":
				return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
			case "PAGO_ATRASADO":
				return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
			case "PENDENTE":
			default:
				return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "PAGO":
				return t("installments.status.paid");
			case "PAGO_ATRASADO":
				return t("installments.status.paidLate");
			case "PENDENTE":
			default:
				return t("installments.status.pending");
		}
	};

	if (isLoadingParcelamento || isLoadingParcelas) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<p className="text-muted-foreground">{t("common.loading")}</p>
				</div>
			</div>
		);
	}

	if (!parcelamento) {
		return (
			<div className="text-center py-8">
				<p className="text-muted-foreground">{t("installments.notFound")}</p>
			</div>
		);
	}

	const saldoAPagar = parcelamento.valorTotal - (parcelamento.valorPago || 0);
	const temParcelas = parcelas && parcelas.length > 0;

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
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
							<BreadcrumbLink href="/pedidoVendas/parcelamentos">
								{t("menu.installments")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{t("installments.view")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<Button onClick={handleBack} variant="outline" size="sm">
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t("common.back")}
				</Button>
			</div>

			{/* Cliente - Nome destacado */}
			<div className="text-lg font-semibold">
				{parcelamento.clienteNome || t("common.noData")}
			</div>

			{/* Cards Row - Informações compactas */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
				<Card>
					<CardHeader className="pb-1 pt-3 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground">
							{t("installments.saleOrder")}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pb-3">
						{parcelamento.vendaPublicId ? (
							<Link
								to={`/pedidoVendas/visualizar/${parcelamento.vendaPublicId}`}
								className="text-sm font-bold text-primary hover:underline"
							>
								#{parcelamento.vendaId}
							</Link>
						) : (
							<div className="text-sm font-bold">
								#{parcelamento.vendaId}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-1 pt-3 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground">
							{t("installments.totalValue")}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pb-3">
						<div className="text-sm font-bold truncate">
							{formatCurrency(parcelamento.valorTotal)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-1 pt-3 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground">
							{t("installments.paidValue")}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pb-3">
						<div className="text-sm font-bold text-green-600 truncate">
							{formatCurrency(parcelamento.valorPago)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-1 pt-3 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground">
							{t("installments.balance")}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pb-3">
						<div className="text-sm font-bold text-orange-600 truncate">
							{formatCurrency(saldoAPagar)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-1 pt-3 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground">
							{t("installments.columns.status")}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pb-3">
						<span
							className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
								parcelamento.situacao === 2
									? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
									: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
							}`}
						>
							{parcelamento.situacao === 2
								? t("installments.completed")
								: t("installments.open")}
						</span>
					</CardContent>
				</Card>
			</div>

			{/* Parcelas */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>{t("installments.installmentsList")}</CardTitle>
					{!temParcelas && saldoAPagar > 0 && (
						<Button onClick={handleSpontaneousPayment} size="sm">
							<Plus className="mr-2 h-4 w-4" />
							{t("installments.addPayment")}
						</Button>
					)}
				</CardHeader>
				<CardContent>
					{!temParcelas ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">
								{t("installments.noInstallments")}
							</p>
							{saldoAPagar > 0 && (
								<Button onClick={handleSpontaneousPayment} variant="outline">
									<Plus className="mr-2 h-4 w-4" />
									{t("installments.registerPayment")}
								</Button>
							)}
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[100px]">
											{t("installments.installmentNumber")}
										</TableHead>
										<TableHead>{t("installments.value")}</TableHead>
										<TableHead>{t("installments.dueDate")}</TableHead>
										<TableHead>{t("installments.paymentDate")}</TableHead>
										<TableHead>{t("installments.columns.status")}</TableHead>
										<TableHead className="text-right w-[120px]">
											{t("common.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{parcelas.map(parcela => (
										<TableRow key={parcela.id}>
											<TableCell className="font-medium">
												#{parcela.numero}
											</TableCell>
											<TableCell>{formatCurrency(parcela.valor)}</TableCell>
											<TableCell>{formatDate(parcela.vencimento)}</TableCell>
											<TableCell>{formatDate(parcela.recebidoEm)}</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
														parcela.status
													)}`}
												>
													{getStatusLabel(parcela.status)}
												</span>
											</TableCell>
											<TableCell className="text-right">
												{parcela.status === "PENDENTE" && (
													<Button
														onClick={() => handleMarcarPaga(parcela.id)}
														variant="outline"
														size="sm"
													>
														<CheckCircle2 className="mr-2 h-4 w-4" />
														{t("installments.markAsPaid")}
													</Button>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{saldoAPagar > 0 && (
								<div className="mt-4 flex justify-end">
									<Button onClick={handleSpontaneousPayment} variant="outline">
										<Plus className="mr-2 h-4 w-4" />
										{t("installments.addPayment")}
									</Button>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Dialog - Marcar como paga */}
			<Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("installments.confirmPayment")}</DialogTitle>
						<DialogDescription>
							{t("installments.confirmPaymentDescription")}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsPayDialogOpen(false)}
							disabled={marcarPagaMutation.isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={confirmMarcarPaga}
							disabled={marcarPagaMutation.isPending}
						>
							{marcarPagaMutation.isPending
								? t("common.loading")
								: t("common.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog - Pagamento espontâneo */}
			<Dialog
				open={isSpontaneousPaymentOpen}
				onOpenChange={setIsSpontaneousPaymentOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("installments.registerPayment")}</DialogTitle>
						<DialogDescription>
							{t("installments.registerPaymentDescription")} <br />
							<span className="font-semibold">
								{t("installments.balance")}: {formatCurrency(saldoAPagar)}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="paymentValue">
								{t("installments.paymentValue")}
							</Label>
							<CurrencyInput
								id="paymentValue"
								placeholder="0,00"
								value={paymentValue}
								decimalsLimit={2}
								intlConfig={{
									locale: selectedPartnerLocale || "pt-BR",
									currency: selectedPartnerIsoCode || "BRL",
								}}
								onValueChange={value => setPaymentValue(value || "")}
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F45A4F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsSpontaneousPaymentOpen(false)}
							disabled={criarEspontaneaMutation.isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={confirmSpontaneousPayment}
							disabled={criarEspontaneaMutation.isPending}
						>
							{criarEspontaneaMutation.isPending
								? t("common.loading")
								: t("common.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
