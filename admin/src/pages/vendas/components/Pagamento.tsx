import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { UseFormReturn } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFormaPagamentoControllerFindAllActive } from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { cn } from "@/lib/utils";
import { PagamentoDialog } from "./PagamentoDialog";
import { PagamentosTable } from "./PagamentosTable";
import type {
	VendaFormMode,
	VendaFormValues,
	VendaSummary,
	VendaTotals,
	PagamentoFormData,
} from "../types";
import type { VendaTipoEnumKey } from "@/api-client/types";

interface PagamentoProps {
	mode: VendaFormMode;
	vendaResumo: VendaSummary | undefined;
	getValues: UseFormReturn<VendaFormValues>["getValues"];
	setValue: UseFormReturn<VendaFormValues>["setValue"];
	watch: UseFormReturn<VendaFormValues>["watch"];
	descontoTotal: number | null | undefined;
	valorFrete: number | null | undefined;
	comissao: number | null | undefined;
	totals: VendaTotals;
	formatCurrency: (value: number) => string;
	onSave: () => Promise<void>;
	onFinalize: () => Promise<void>;
	isSaving: boolean;
	isFinalizing: boolean;
	isSubmitting: boolean;
	onBack: () => void;
	tipoVenda: VendaTipoEnumKey;
	shouldShowBillingAndPayment: boolean;
}

export const Pagamento: React.FC<PagamentoProps> = ({
	mode,
	setValue,
	watch,
	descontoTotal,
	valorFrete,
	comissao,
	totals,
	formatCurrency,
	onSave,
	onFinalize,
	isSaving,
	isFinalizing,
	isSubmitting,
	onBack,
	tipoVenda,
	shouldShowBillingAndPayment,
	vendaResumo,
}) => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartnerContext();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(
		null
	);

	const parceiroIdNumber = selectedPartnerId ? Number(selectedPartnerId) : null;
	const locale = selectedPartnerLocale || "pt-BR";
	const currencyCode = selectedPartnerIsoCode || "BRL";

	const { data: formasPagamentoData } =
		useFormaPagamentoControllerFindAllActive(
			{ "x-parceiro-id": parceiroIdNumber ?? 0 },
			{
				query: {
					enabled: !!parceiroIdNumber,
				},
			}
		);

	const formasPagamento = formasPagamentoData || [];

	const pagamentos = watch("pagamentos") || [];

	const totalAlocado = pagamentos.reduce((sum, pag) => sum + pag.valor, 0);
	const faltaAlocar = totals.total - totalAlocado;
	const totalmenteAlocado = Math.abs(faltaAlocar) < 0.01;
	const jaTemEntrada = pagamentos.some(p => p.entrada);

	const handleOpenDialog = () => {
		setEditingPaymentIndex(null);
		setDialogOpen(true);
	};

	const handleAddFlexivelPayment = () => {
		// Adicionar pagamento flexível automaticamente
		const formaPagamentoPadrao = formasPagamento[0]?.idFormaPag || 0;

		const pagamento: PagamentoFormData = {
			tipo: "PARCELADO_FLEXIVEL",
			formaPagamentoId: formaPagamentoPadrao,
			valor: faltaAlocar,
			entrada: false,
		};

		setValue("pagamentos", [...pagamentos, pagamento], {
			shouldValidate: true,
			shouldDirty: true,
		});
	};

	const handleEditPayment = (index: number) => {
		setEditingPaymentIndex(index);
		setDialogOpen(true);
	};

	const handleSavePayment = (pagamento: PagamentoFormData) => {
		if (editingPaymentIndex !== null) {
			// Editar pagamento existente
			const updatedPagamentos = [...pagamentos];
			updatedPagamentos[editingPaymentIndex] = pagamento;
			setValue("pagamentos", updatedPagamentos, {
				shouldValidate: true,
				shouldDirty: true,
			});
		} else {
			// Adicionar novo pagamento
			setValue("pagamentos", [...pagamentos, pagamento], {
				shouldValidate: true,
				shouldDirty: true,
			});
		}
	};

	const handleRemovePayment = (index: number) => {
		const filtered = pagamentos.filter((_, idx) => idx !== index);
		setValue("pagamentos", filtered, {
			shouldValidate: true,
			shouldDirty: true,
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("salesOrders.form.sections.review")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Cards de Valores e Ajustes lado a lado */}
				<div className="grid gap-4 md:grid-cols-2">
					{/* Card 1: Situação dos Valores */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								{t("salesOrders.form.labels.valueSituation")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">
									{t("salesOrders.form.labels.total")}:
								</span>
								<span className="font-semibold">
									{formatCurrency(totals.total)}
								</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span>{t("salesOrders.form.labels.totalAllocated")}:</span>
								<span
									className={cn(
										totalAlocado > totals.total && "text-destructive"
									)}
								>
									{formatCurrency(totalAlocado)}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span>{t("salesOrders.form.labels.remaining")}:</span>
								<span
									className={cn(
										faltaAlocar > 0 && "text-orange-600",
										faltaAlocar < 0 && "text-destructive",
										totalmenteAlocado && "text-green-600 font-semibold"
									)}
								>
									{formatCurrency(Math.abs(faltaAlocar))}
									{totalmenteAlocado && " ✓"}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Card 2: Ajustes de Valor */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								{t("salesOrders.form.labels.adjustments")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="space-y-2">
								<Label className="text-sm">
									{t("salesOrders.form.labels.discountItems")}
								</Label>
								<CurrencyInput
									value={totals.descontoItens}
									disabled
									intlConfig={{ locale, currency: currencyCode }}
									className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-sm">
									{t("salesOrders.form.labels.discountGeneral")}
								</Label>
								{mode === "view" ? (
									<CurrencyInput
										value={descontoTotal ?? 0}
										disabled
										intlConfig={{ locale, currency: currencyCode }}
										className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
									/>
								) : (
									<CurrencyInput
										placeholder="0,00"
										value={descontoTotal ?? 0}
										decimalsLimit={2}
										intlConfig={{ locale, currency: currencyCode }}
										onValueChange={value => {
											const numValue =
												parseFloat(value?.replace(",", ".") || "0") || 0;
											setValue("descontoTotal", numValue);
										}}
										className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
									/>
								)}
							</div>

							<div className="space-y-2">
								<Label className="text-sm">
									{t("salesOrders.form.labels.freight")}
								</Label>
								{mode === "view" ? (
									<CurrencyInput
										value={valorFrete ?? 0}
										disabled
										intlConfig={{ locale, currency: currencyCode }}
										className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
									/>
								) : (
									<CurrencyInput
										placeholder="0,00"
										value={valorFrete ?? 0}
										decimalsLimit={2}
										intlConfig={{ locale, currency: currencyCode }}
										onValueChange={value => {
											const numValue =
												parseFloat(value?.replace(",", ".") || "0") || 0;
											setValue("valorFrete", numValue);
										}}
										className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
									/>
								)}
							</div>

							<div className="space-y-2">
								<Label className="text-sm">
									{t("salesOrders.form.labels.commission")}
								</Label>
								{mode === "view" ? (
									<CurrencyInput
										value={comissao ?? 0}
										disabled
										intlConfig={{ locale, currency: currencyCode }}
										className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
									/>
								) : (
									<CurrencyInput
										placeholder="0,00"
										value={comissao ?? 0}
										decimalsLimit={2}
										intlConfig={{ locale, currency: currencyCode }}
										onValueChange={value => {
											const numValue =
												parseFloat(value?.replace(",", ".") || "0") || 0;
											setValue("comissao", numValue);
										}}
										className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
									/>
								)}
							</div>

						</CardContent>
					</Card>
				</div>

				<Separator />

				{/* Card de Formas de Pagamento - Só aparece para vendas com pagamento */}
				{shouldShowBillingAndPayment && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">
								{t("salesOrders.form.labels.paymentMethods")}
							</CardTitle>
							{!mode?.includes("view") && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button type="button" variant="outline" size="sm">
											<Plus className="h-4 w-4 mr-1" />
											{t("salesOrders.form.labels.addPayment")}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={handleOpenDialog}>
											{t("salesOrders.form.labels.normalPayment")}
										</DropdownMenuItem>
										{faltaAlocar > 0 && (
											<DropdownMenuItem onClick={handleAddFlexivelPayment}>
												{t("salesOrders.form.paymentTypes.PARCELADO_FLEXIVEL")}
											</DropdownMenuItem>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<PagamentosTable
							pagamentos={pagamentos}
							formasPagamento={formasPagamento}
							onEdit={handleEditPayment}
							onRemove={handleRemovePayment}
							formatCurrency={formatCurrency}
							isView={mode === "view"}
						/>
					</CardContent>
				</Card>
				)}

				<Separator />

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						{t("salesOrders.form.actions.back")}
					</Button>
				{mode !== "view" ? (
					<div className="flex gap-2">
						{shouldShowBillingAndPayment && (
							<Button
								variant="outline"
								onClick={onSave}
								disabled={isSaving || isFinalizing || isSubmitting}
							>
								{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{t("salesOrders.form.actions.save")}
							</Button>
						)}
						<Button
							onClick={onFinalize}
							disabled={
								isSaving ||
								isFinalizing ||
								isSubmitting ||
								(shouldShowBillingAndPayment && !totalmenteAlocado)
							}
							title={
								shouldShowBillingAndPayment && !totalmenteAlocado
									? t("salesOrders.form.messages.completePaymentFirst")
									: ""
							}
						>
							{isFinalizing && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{tipoVenda === "BRINDE"
								? t("salesOrders.form.actions.confirmGift")
								: tipoVenda === "PERMUTA"
								? t("salesOrders.form.actions.confirmExchange")
								: tipoVenda === "CONDICIONAL" && vendaResumo?.status === "PEDIDO"
								? t("salesOrders.form.actions.confirmConditional")
								: t("salesOrders.form.actions.confirmSale")}
						</Button>
					</div>
					) : (
						<Button
							variant="secondary"
							onClick={() => navigate("/pedidoVendas")}
						>
							{t("salesOrders.form.actions.backToList")}
						</Button>
					)}
				</div>
			</CardContent>

			<PagamentoDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSave={handleSavePayment}
				formasPagamento={formasPagamento}
				editingPayment={
					editingPaymentIndex !== null ? pagamentos[editingPaymentIndex] : null
				}
				locale={locale}
				currencyCode={currencyCode}
				faltaAlocar={faltaAlocar}
				jaTemEntrada={jaTemEntrada}
			/>
		</Card>
	);
};
