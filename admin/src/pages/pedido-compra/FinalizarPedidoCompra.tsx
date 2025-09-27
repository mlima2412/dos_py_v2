import React, { useEffect, useMemo, useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { usePartner } from "@/hooks/usePartner";
import {
	useCurrencyControllerFindAllActive,
	usePedidoCompraControllerFindOne,
	usePedidoCompraControllerProcessaPedidoCompra,
} from "@/api-client";
import type { Currency, PedidoCompra } from "@/api-client/types";
import {
	formatCurrency,
	formatCurrencyForPartner,
} from "./utils/currencyUtils";
import { parseToNumber } from "./utils/numberUtils";

const LOCAL_STORAGE_KEY_PREFIX = "purchaseOrderFinalize:";

const finalizePurchaseSchema = z
	.object({
		paymentType: z.enum(
			["A_VISTA_IMEDIATA", "A_PRAZO_SEM_PARCELAS", "PARCELADO"],
			{
				errorMap: () => ({
					message: "purchaseOrders.finalize.validation.paymentTypeRequired",
				}),
			}
		),
		dueDate: z.date().optional(),
		entryValue: z
			.number({
				invalid_type_error: "purchaseOrders.finalize.validation.entryValueMin",
			})
			.min(0, { message: "purchaseOrders.finalize.validation.entryValueMin" }),
		installments: z
			.number({
				invalid_type_error:
					"purchaseOrders.finalize.validation.installmentsMin",
			})
			.min(1, {
				message: "purchaseOrders.finalize.validation.installmentsMin",
			}),
		firstInstallmentDate: z.date().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.paymentType === "A_PRAZO_SEM_PARCELAS" && !data.dueDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["dueDate"],
				message: "purchaseOrders.finalize.validation.dueDateRequired",
			});
		}

		if (data.paymentType === "PARCELADO") {
			if (!data.firstInstallmentDate) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["firstInstallmentDate"],
					message:
						"purchaseOrders.finalize.validation.firstInstallmentDateRequired",
				});
			}

			if (!data.installments || data.installments < 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["installments"],
					message: "purchaseOrders.finalize.validation.installmentsMin",
				});
			}
		}
	});

export type FinalizePurchaseFormData = z.infer<typeof finalizePurchaseSchema>;

interface StoredFinalizeFormData {
	paymentType: FinalizePurchaseFormData["paymentType"];
	dueDate: string | null;
	entryValue: number;
	installments: number;
	firstInstallmentDate: string | null;
}

const formatInputCurrency = (value: number) =>
	Number.isFinite(value)
		? value.toLocaleString("pt-BR", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})
		: "0,00";

const getStorageKey = (
	partnerId: string | null | undefined,
	publicId?: string
) => {
	if (!partnerId || !publicId) return null;
	return `${LOCAL_STORAGE_KEY_PREFIX}${partnerId}:${publicId}`;
};

const mapPedidoCurrency = (
	pedido: PedidoCompra | undefined,
	currencies: Currency[] | undefined
) => {
	if (!pedido?.currencyId || !currencies) return undefined;
	return currencies.find(currency => currency.id === pedido.currencyId);
};

export const FinalizarPedidoCompra: React.FC = () => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { publicId } = useParams<{ publicId: string }>();
	const { selectedPartnerId, selectedPartnerIsoCode, selectedPartnerLocale } =
		usePartner();

	const partnerId = selectedPartnerId ? Number(selectedPartnerId) : null;
	const storageKey = getStorageKey(selectedPartnerId, publicId);

	const form = useForm<FinalizePurchaseFormData>({
		resolver: zodResolver(finalizePurchaseSchema, {
			errorMap: issue => {
				if (issue.message && issue.message.startsWith("purchaseOrders")) {
					return {
						message: t(issue.message as never),
					};
				}
				return { message: t("purchaseOrders.finalize.validation.generic") };
			},
		}),
		defaultValues: {
			paymentType: "A_VISTA_IMEDIATA",
			dueDate: undefined,
			entryValue: 0,
			installments: 1,
			firstInstallmentDate: undefined,
		},
	});

	const paymentType = form.watch("paymentType");
	const [entryValueInput, setEntryValueInput] = useState<string>(
		formatInputCurrency(0)
	);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const {
		data: pedido,
		isLoading: isLoadingPedido,
		error: pedidoError,
	} = usePedidoCompraControllerFindOne(
		publicId ?? "",
		{ "x-parceiro-id": partnerId ?? 0 },
		{
			query: {
				enabled: Boolean(publicId && partnerId),
				refetchOnMount: "always",
				staleTime: 0,
			},
		}
	);

	const { data: currencies, isLoading: isLoadingCurrencies } =
		useCurrencyControllerFindAllActive();

	const processOrderMutation = usePedidoCompraControllerProcessaPedidoCompra({
		mutation: {
			onSuccess: () => {
				toast.success(t("expenses.messages.processOrderSuccess"));
				if (typeof window !== "undefined" && storageKey) {
					window.localStorage.removeItem(storageKey);
				}
				navigate("/pedidoCompra");
			},
			onError: error => {
				console.error("Erro ao processar pedido:", error);
				toast.error(t("expenses.messages.processOrderError"));
			},
		},
	});

	const currencyFromOrder = useMemo(
		() => mapPedidoCurrency(pedido, currencies),
		[pedido, currencies]
	);

	const supplierName = pedido?.fornecedor?.nome || "-";
	const valorOriginalNumber = useMemo(
		() => parseToNumber(pedido?.valorTotal ?? 0) || 0,
		[pedido?.valorTotal]
	);
	const cotacaoNumber = useMemo(() => {
		const parsed = parseToNumber(pedido?.cotacao ?? 1);
		return Number.isNaN(parsed) ? 1 : parsed;
	}, [pedido?.cotacao]);
	const valorConvertidoNumber = useMemo(
		() => valorOriginalNumber * cotacaoNumber,
		[valorOriginalNumber, cotacaoNumber]
	);

	const formattedOriginalValue = useMemo(
		() =>
			formatCurrency(valorOriginalNumber, {
				locale: currencyFromOrder?.locale,
				currency: currencyFromOrder?.isoCode,
			}),
		[valorOriginalNumber, currencyFromOrder]
	);

	const formattedConvertedValue = useMemo(
		() =>
			formatCurrencyForPartner(
				valorConvertidoNumber,
				selectedPartnerLocale,
				selectedPartnerIsoCode
			),
		[valorConvertidoNumber, selectedPartnerLocale, selectedPartnerIsoCode]
	);

	const cotacaoDisplay = useMemo(() => {
		return cotacaoNumber.toLocaleString(selectedPartnerLocale || "pt-BR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 4,
		});
	}, [cotacaoNumber, selectedPartnerLocale]);

	useEffect(() => {
		if (typeof window === "undefined" || !storageKey) {
			return;
		}

		try {
			const saved = window.localStorage.getItem(storageKey);
			if (!saved) return;

			const parsed = JSON.parse(saved) as StoredFinalizeFormData;
			const restoredValues: FinalizePurchaseFormData = {
				paymentType: parsed.paymentType || "A_VISTA_IMEDIATA",
				entryValue: Number.isFinite(parsed.entryValue) ? parsed.entryValue : 0,
				installments:
					parsed.installments && parsed.installments > 0
						? parsed.installments
						: 1,
				dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
				firstInstallmentDate: parsed.firstInstallmentDate
					? new Date(parsed.firstInstallmentDate)
					: undefined,
			};
			form.reset(restoredValues, { keepDefaultValues: true });
			setEntryValueInput(formatInputCurrency(restoredValues.entryValue));
		} catch (error) {
			console.error(
				"Erro ao carregar dados de finalização do localStorage",
				error
			);
		}
	}, [form, storageKey]);

	useEffect(() => {
		if (typeof window === "undefined" || !storageKey) {
			return;
		}

		const subscription = form.watch(values => {
			const dataToPersist: StoredFinalizeFormData = {
				paymentType: values.paymentType,
				dueDate: values.dueDate ? values.dueDate.toISOString() : null,
				entryValue: values.entryValue ?? 0,
				installments: values.installments ?? 1,
				firstInstallmentDate: values.firstInstallmentDate
					? values.firstInstallmentDate.toISOString()
					: null,
			};
			window.localStorage.setItem(storageKey, JSON.stringify(dataToPersist));
		});

		return () => subscription.unsubscribe();
	}, [form, storageKey]);

	useEffect(() => {
		if (!publicId && pedidoError) {
			navigate("/pedidoCompra");
		}
	}, [publicId, pedidoError, navigate]);

	const handleCancel = () => {
		navigate("/pedidoCompra");
	};

	const onSubmit = (values: FinalizePurchaseFormData) => {
		if (!publicId) return;
		setShowConfirmDialog(true);
	};

	const handleConfirmProcess = () => {
		if (!publicId || !partnerId) return;

		const formValues = form.getValues();
		const payload = {
			publicId,
			paymentType: formValues.paymentType,
			dueDate: formValues.dueDate
				? formValues.dueDate.toISOString()
				: undefined,
			entryValue: formValues.entryValue,
			installments: formValues.installments,
			firstInstallmentDate: formValues.firstInstallmentDate
				? formValues.firstInstallmentDate.toISOString()
				: undefined,
		};
		processOrderMutation.mutate({
			data: payload,
			headers: { "x-parceiro-id": partnerId },
		});

		setShowConfirmDialog(false);
	};

	if (!selectedPartnerId) {
		return (
			<DashboardLayout>
				<div className="text-center text-muted-foreground">
					{t("common.noPartnerSelected")}
				</div>
			</DashboardLayout>
		);
	}

	if (isLoadingPedido || isLoadingCurrencies) {
		return (
			<DashboardLayout>
				<div className="text-center text-muted-foreground">
					{t("common.loading")}
				</div>
			</DashboardLayout>
		);
	}

	if (pedidoError || !pedido) {
		return (
			<DashboardLayout>
				<div className="text-center space-y-4">
					<p className="text-destructive">
						{t("purchaseOrders.finalize.messages.loadError")}
					</p>
					<Button variant="outline" onClick={handleCancel}>
						{t("common.back")}
					</Button>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/inicio">
							{t("purchaseOrders.finalize.breadcrumb.home")}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/pedidoCompra">
							{t("purchaseOrders.finalize.breadcrumb.purchaseOrders")}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>
							{t("purchaseOrders.finalize.breadcrumb.finalize")}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="space-y-6 mt-4">
				<Card>
					<CardContent className="pt-6 space-y-4">
						<h2 className="text-lg font-semibold">
							{t("purchaseOrders.finalize.summary.title")}
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="text-xs uppercase text-muted-foreground">
									{t("purchaseOrders.finalize.summary.supplier")}
								</p>
								<p className="text-sm font-medium">{supplierName}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">
									{t("purchaseOrders.finalize.summary.currency")}
								</p>
								<p className="text-sm font-medium">
									{currencyFromOrder
										? `${currencyFromOrder.isoCode} - ${currencyFromOrder.nome}`
										: t("purchaseOrders.finalize.summary.unknownValue")}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">
									{t("purchaseOrders.finalize.summary.originalValue")}
								</p>
								<p className="text-sm font-medium">{formattedOriginalValue}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">
									{t("purchaseOrders.finalize.summary.totalValue")}
								</p>
								<p className="text-sm font-medium">{formattedConvertedValue}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">
									{t("purchaseOrders.finalize.summary.exchangeRate")}
								</p>
								<p className="text-sm font-medium">{cotacaoDisplay}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<h2 className="text-lg font-semibold mb-4">
							{t("purchaseOrders.finalize.form.title")}
						</h2>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								<FormField
									control={form.control}
									name="paymentType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("purchaseOrders.finalize.form.paymentType")}
											</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={value => field.onChange(value)}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"purchaseOrders.finalize.form.paymentTypePlaceholder"
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="A_VISTA_IMEDIATA">
															{t(
																"purchaseOrders.finalize.paymentTypes.A_VISTA_IMEDIATA"
															)}
														</SelectItem>
														<SelectItem value="A_PRAZO_SEM_PARCELAS">
															{t(
																"purchaseOrders.finalize.paymentTypes.A_PRAZO_SEM_PARCELAS"
															)}
														</SelectItem>
														<SelectItem value="PARCELADO">
															{t(
																"purchaseOrders.finalize.paymentTypes.PARCELADO"
															)}
														</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{paymentType === "PARCELADO" && (
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<FormField
											control={form.control}
											name="entryValue"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("purchaseOrders.finalize.form.entryValue")}
														<span className="ml-1 text-muted-foreground text-xs">
															{t("purchaseOrders.finalize.form.optional")}
														</span>
													</FormLabel>
													<FormControl>
														<CurrencyInput
															value={entryValueInput}
															decimalsLimit={2}
															decimalSeparator=","
															groupSeparator="."
															onValueChange={value => {
																setEntryValueInput(value ?? "");
																const numericValue = parseToNumber(
																	value ?? "0"
																);
																field.onChange(
																	Number.isNaN(numericValue) ? 0 : numericValue
																);
															}}
															className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
															placeholder={t(
																"purchaseOrders.finalize.placeholders.entryValue"
															)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="installments"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("purchaseOrders.finalize.form.installments")}
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															min={1}
															value={field.value}
															onChange={event => {
																const raw = event.target.value;
																const numeric = parseInt(raw, 10);
																field.onChange(
																	Number.isNaN(numeric) ? 1 : numeric
																);
															}}
															placeholder={t(
																"purchaseOrders.finalize.placeholders.installments"
															)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="firstInstallmentDate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t(
															"purchaseOrders.finalize.form.firstInstallmentDate"
														)}
													</FormLabel>
													<FormControl>
														<DatePicker
															date={field.value}
															onDateChange={field.onChange}
															placeholder={t(
																"purchaseOrders.finalize.placeholders.firstInstallmentDate"
															)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								)}

								{paymentType === "A_PRAZO_SEM_PARCELAS" && (
									<FormField
										control={form.control}
										name="dueDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("purchaseOrders.finalize.form.dueDate")}
												</FormLabel>
												<FormControl>
													<DatePicker
														date={field.value}
														onDateChange={field.onChange}
														placeholder={t(
															"purchaseOrders.finalize.placeholders.dueDate"
														)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								<div className="flex justify-end gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={handleCancel}
									>
										{t("purchaseOrders.finalize.actions.cancel")}
									</Button>
									<Button
										type="submit"
										disabled={processOrderMutation.isPending}
									>
										{processOrderMutation.isPending
											? t("common.loading")
											: t("purchaseOrders.finalize.actions.finalize")}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>

				{/* Dialog de Confirmação */}
				<AlertDialog
					open={showConfirmDialog}
					onOpenChange={setShowConfirmDialog}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{t("expenses.messages.processOrderConfirmTitle")}
							</AlertDialogTitle>
							<AlertDialogDescription className="space-y-2">
								<p>{t("expenses.messages.processOrderConfirmDescription")}</p>
								<ul className="list-disc list-inside space-y-1 text-sm">
									<li>{t("expenses.messages.processOrderConfirmImpact1")}</li>
									<li>{t("expenses.messages.processOrderConfirmImpact2")}</li>
									<li>{t("expenses.messages.processOrderConfirmImpact3")}</li>
									<li>{t("expenses.messages.processOrderConfirmImpact4")}</li>
								</ul>
								<p className="font-semibold text-destructive">
									{t("expenses.messages.processOrderConfirmWarning")}
								</p>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								{t("expenses.messages.processOrderConfirmCancel")}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirmProcess}
								disabled={processOrderMutation.isPending}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{processOrderMutation.isPending
									? t("common.loading")
									: t("expenses.messages.processOrderConfirmConfirm")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</DashboardLayout>
	);
};
