import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/useToast";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	vendaControllerFindOneQueryKey,
	vendaControllerPaginateQueryKey,
	useVendaControllerFinalizeDireta,
} from "@/api-client";
import type { SkuListingRef } from "@/components/SkuListing";
import type { SelectedSkusListRef } from "@/components/SelectedSkusList";

import type {
	VendaFormMode,
	VendaFormStep,
	VendaSummary,
	VendaFormHandlers,
} from "./types";
import { useVendaForm } from "./hooks/useVendaForm";
import { useVendaData } from "./hooks/useVendaData";
import { useVendaMutations } from "./hooks/useVendaMutations";
import { useVendaTotals } from "./hooks/useVendaTotals";
import { NavigationSteps } from "./components/NavigationSteps";
import { DadosBasicos } from "./components/DadosBasicos";
import { SelecaoItens } from "./components/SelecaoItens";
import { FaturamentoForm } from "./components/FaturamentoForm";
import { Pagamento } from "./components/Pagamento";

interface FormularioVendaProps {
	mode: VendaFormMode;
}

interface RouteParams extends Record<string, string | undefined> {
	publicId?: string;
}

export const FormularioVenda: React.FC<FormularioVendaProps> = ({ mode }) => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { publicId } = useParams<RouteParams>();
	const queryClient = useQueryClient();
	const { success: showSuccess, error: showError } = useToast();
	const { selectedPartnerId } = usePartnerContext();

	const [activeStep, setActiveStep] = useState<VendaFormStep>("basic");
	const [canAccessItems, setCanAccessItems] = useState<boolean>(
		mode !== "create"
	);
	const [canAccessBilling, setCanAccessBilling] = useState<boolean>(
		mode !== "create"
	);
	const [canAccessReview, setCanAccessReview] = useState<boolean>(
		mode === "view"
	);
	const [vendaResumo, setVendaResumo] = useState<VendaSummary>();
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);
	const [skuSearchCode, setSkuSearchCode] = useState("");
	const [isSavingBasic, setIsSavingBasic] = useState(false);
	const [isSavingPayment, setIsSavingPayment] = useState(false);
	const [isFinalizing, setIsFinalizing] = useState(false);

	const skuListingRef = useRef<SkuListingRef>(null);
	const selectedSkusRef = useRef<SelectedSkusListRef>(null);
	const hasInitializedVendaRef = useRef(false);

	const parceiroIdNumber = selectedPartnerId ? Number(selectedPartnerId) : null;

	// Initialize form first
	const {
		formMethods,
		control,
		getValues,
		setValue,
		trigger,
		watch,
		isSubmitting,
		append,
		update,
		remove,
		replace,
	} = useVendaForm({
		mode,
		publicId,
		setVendaResumo,
		setCanAccessItems,
		setCanAccessBilling,
		setCanAccessReview,
	});

	const watchedLocalSaidaId = watch("localSaidaId");

	// Initialize data hooks with form functions
	const dataHook = useVendaData({
		mode,
		publicId,
		parceiroIdNumber,
		selectedLocalPublicId: null,
		selectedLocalId: watchedLocalSaidaId,
		activeStep,
		getValues,
		replace,
	});

	const {
		locaisOptions,
		isLoadingLocais,
		isLoadingVenda,
		vendaExistente,
		mapVendaItemToFormData,
	} = dataHook;

	// Update form when vendaExistente is loaded
	useEffect(() => {
		if (mode === "create") return;
		if (!vendaExistente || !mapVendaItemToFormData) return;
		if (hasInitializedVendaRef.current) return;

		const itens = vendaExistente.VendaItem?.map(mapVendaItemToFormData) || [];

		// Reset form with all data from vendaExistente
		formMethods.reset({
			clienteId: vendaExistente.clienteId,
			localSaidaId: vendaExistente.localSaidaId,
			tipo: vendaExistente.tipo,
			dataVenda: vendaExistente.dataVenda
				? new Date(vendaExistente.dataVenda)
				: new Date(),
			dataEntrega: vendaExistente.dataEntrega
				? new Date(vendaExistente.dataEntrega)
				: null,
			observacao: vendaExistente.observacao ?? "",
			itens,
			valorFrete: vendaExistente.valorFrete ?? 0,
			descontoTotal: vendaExistente.desconto ?? 0,
			comissao: vendaExistente.valorComissao ?? 0,
			numeroFatura: vendaExistente.numeroFatura ?? null,
			desejaFatura: !!(
				vendaExistente.numeroFatura ||
				vendaExistente.ruccnpj ||
				vendaExistente.nomeFatura
			),
			faturaEmNomeCliente: !vendaExistente.nomeFatura,
			nomeFatura: vendaExistente.nomeFatura ?? null,
			ruccnpjFatura: vendaExistente.ruccnpj ?? null,
		});

		setVendaResumo({
			id: vendaExistente.id,
			publicId: vendaExistente.publicId,
			status: vendaExistente.status,
			clienteId: vendaExistente.clienteId,
			clienteNome: vendaExistente.clienteNome,
			clienteSobrenome: vendaExistente.clienteSobrenome,
		});
		setCanAccessItems(true);
		setCanAccessBilling(itens.length > 0);
		setCanAccessReview(mode === "view" || itens.length > 0);
		hasInitializedVendaRef.current = true;
	}, [vendaExistente, mapVendaItemToFormData, mode, formMethods]);

	// Reset initialization ref when publicId changes
	useEffect(() => {
		hasInitializedVendaRef.current = false;
	}, [publicId]);

	const itensSelecionados = watch("itens");
	const descontoTotal = watch("descontoTotal");
	const valorFrete = watch("valorFrete");
	const comissao = watch("comissao");

	// Get selected local from locais options
	const selectedLocal = useMemo(() => {
		if (!watchedLocalSaidaId) return null;
		return (
			locaisOptions.find(option => option.id === watchedLocalSaidaId) ?? null
		);
	}, [locaisOptions, watchedLocalSaidaId]);

	// Calculate totals
	const { totals, formatCurrency } = useVendaTotals(
		itensSelecionados,
		descontoTotal,
		valorFrete,
		comissao
	);

	// Mutations
	const {
		handleCreateOrUpdateVenda,
		handleAddSku,
		handleRemoveItem,
		handleUpdateQuantity,
		handleUpdateDiscount,
		handleSearchSkuByCode,
		findSkuByCode,
	} = useVendaMutations({
		mode,
		parceiroIdNumber,
		vendaResumo,
		setVendaResumo,
		itensSelecionados,
		append,
		update,
		remove,
		produtosDisponiveis: dataHook.produtosDisponiveis,
		selectedLocalId: selectedLocal?.id ?? null,
		setSelectedProductId,
		skuSearchCode,
		setSkuSearchCode,
		skuListingRef,
		selectedSkusRef,
	});

	// Finalization hook
	const finalizacaoMutation = useVendaControllerFinalizeDireta({
		mutation: {
			onSuccess: () => {
				showSuccess(t("salesOrders.form.messages.finalizeSuccess"));
				if (vendaResumo?.publicId) {
					queryClient.invalidateQueries({
						queryKey: vendaControllerFindOneQueryKey(vendaResumo.publicId),
					});
				}
				queryClient.invalidateQueries({
					queryKey: vendaControllerPaginateQueryKey(),
				});
				navigate("/pedidoVendas");
			},
			onError: (error) => {
				console.error("Erro ao finalizar venda:", error);
				const mensagem = error?.data?.message ?? t("salesOrders.form.messages.finalizeError");
				showError(mensagem);
			},
		},
	});

	// Reset selected product when location changes
	useEffect(() => {
		setSelectedProductId(null);
		setSkuSearchCode("");
	}, [selectedLocal?.publicId]);

	// Update billing and review access based on items
	useEffect(() => {
		if (mode === "view") {
			setCanAccessBilling(true);
			setCanAccessReview(true);
			return;
		}
		const hasItems = itensSelecionados.length > 0;
		setCanAccessBilling(hasItems);
		setCanAccessReview(hasItems);
	}, [itensSelecionados.length, mode]);

	const handleStepChange = useCallback(
		(nextStep: VendaFormStep) => {
			if (nextStep === "items" && !canAccessItems) return;
			if (nextStep === "billing" && !canAccessBilling) return;
			if (nextStep === "review" && !canAccessReview) return;
			setActiveStep(nextStep);
		},
		[canAccessItems, canAccessBilling, canAccessReview]
	);

	const handleStepOneSave = useCallback(async () => {
		setIsSavingBasic(true);
		try {
			const isValid = await trigger([
				"clienteId",
				"localSaidaId",
				"tipo",
				"dataEntrega",
				"observacao",
			]);
			if (!isValid) {
				showError(t("salesOrders.form.messages.checkRequiredFields"));
				return;
			}

			const values = getValues();
			const payload = {
				clienteId: values.clienteId!,
				localSaidaId: values.localSaidaId!,
				tipo: values.tipo,
				dataEntrega: values.dataEntrega,
				observacao: values.observacao || null,
			};

			const resultado = await handleCreateOrUpdateVenda(payload);
			if (resultado) {
				showSuccess(t("salesOrders.form.messages.basicDataSaved"));
				setCanAccessItems(true);
				setActiveStep("items");
			}
		} catch (error) {
			console.error(error);
			showError(t("salesOrders.form.messages.basicDataError"));
		} finally {
			setIsSavingBasic(false);
		}
	}, [
		getValues,
		handleCreateOrUpdateVenda,
		showError,
		showSuccess,
		t,
		trigger,
	]);

	const handleSavePayment = useCallback(async () => {
		if (!parceiroIdNumber || !vendaResumo?.publicId) return;

		setIsSavingPayment(true);
		try {
			await handleCreateOrUpdateVenda({
				clienteId: getValues("clienteId")!,
				localSaidaId: getValues("localSaidaId")!,
				tipo: getValues("tipo"),
				dataEntrega: getValues("dataEntrega"),
				observacao: getValues("observacao") || null,
			});

			showSuccess(t("salesOrders.form.messages.basicDataSaved"));
		} catch (error) {
			console.error(error);
			showError(t("salesOrders.form.messages.basicDataError"));
		} finally {
			setIsSavingPayment(false);
		}
	}, [
		parceiroIdNumber,
		vendaResumo,
		handleCreateOrUpdateVenda,
		getValues,
		showSuccess,
		showError,
		t,
	]);

	const handleFinalize = useCallback(async () => {
		if (!parceiroIdNumber || !vendaResumo?.publicId) {
			showError("Salve os dados básicos da venda antes de finalizar.");
			return;
		}

		setIsFinalizing(true);
		try {
			// 1. Salvar dados básicos da venda (desconto, frete, comissão, fatura)
			await handleCreateOrUpdateVenda({
				clienteId: getValues("clienteId")!,
				localSaidaId: getValues("localSaidaId")!,
				tipo: getValues("tipo"),
				dataEntrega: getValues("dataEntrega"),
				observacao: getValues("observacao") || null,
				valorFrete: getValues("valorFrete"),
				descontoTotal: getValues("descontoTotal"),
				comissao: getValues("comissao"),
				numeroFatura: getValues("numeroFatura"),
				nomeFatura: getValues("nomeFatura"),
				ruccnpjFatura: getValues("ruccnpjFatura"),
			});

			// 2. Validar e processar pagamentos
			const pagamentos = getValues("pagamentos") || [];

			if (pagamentos.length === 0) {
				showError("Adicione ao menos uma forma de pagamento");
				return;
			}

			// 3. Preparar payload de finalização
			const pagamentosPayload = pagamentos.map(pagamento => ({
				formaPagamentoId: pagamento.formaPagamentoId,
				tipo: pagamento.tipo,
				valor: pagamento.valor,
				entrada: pagamento.entrada,
				valorDelivery: pagamento.valorDelivery,
				vencimento: pagamento.vencimento
					? pagamento.vencimento.toISOString()
					: undefined,
				numeroParcelas: pagamento.numeroParcelas,
				primeiraParcelaData: pagamento.primeiraParcelaData
					? pagamento.primeiraParcelaData.toISOString()
					: undefined,
			}));

			// 4. Chamar endpoint de finalização
			await finalizacaoMutation.mutateAsync({
				publicId: vendaResumo.publicId,
				headers: {
					"x-parceiro-id": parceiroIdNumber,
				},
				data: {
					valorFrete: getValues("valorFrete") ?? undefined,
					descontoTotal: getValues("descontoTotal") ?? undefined,
					valorComissao: getValues("comissao") ?? undefined,
					numeroFatura: getValues("numeroFatura") ?? undefined,
					nomeFatura: getValues("nomeFatura") ?? undefined,
					ruccnpj: getValues("ruccnpjFatura") ?? undefined,
					pagamentos: pagamentosPayload,
				},
			});
		} catch (error) {
			// Erro já tratado no onError do mutation
			console.error("Erro ao finalizar venda:", error);
		} finally {
			setIsFinalizing(false);
		}
	}, [
		parceiroIdNumber,
		vendaResumo,
		handleCreateOrUpdateVenda,
		getValues,
		finalizacaoMutation,
		showError,
	]);

	const handlers: VendaFormHandlers = {
		onAddSku: handleAddSku,
		onRemoveItem: handleRemoveItem,
		onUpdateQuantity: handleUpdateQuantity,
		onUpdateDiscount: handleUpdateDiscount,
		onSearchSkuByCode: handleSearchSkuByCode,
	};

	if (!selectedPartnerId) {
		return (
			<DashboardLayout>
				<div className="p-6 text-center text-muted-foreground">
					{t("common.noPartnerSelected")}
				</div>
			</DashboardLayout>
		);
	}

	if (mode !== "create" && isLoadingVenda) {
		return (
			<DashboardLayout>
				<div className="flex h-full items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/pedidoVendas">
								{t("salesOrders.form.breadcrumb.section")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{t("salesOrders.form.breadcrumb.list")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<FormProvider {...formMethods}>
					<div className="space-y-6">
						<NavigationSteps
							activeStep={activeStep}
							canAccessItems={canAccessItems}
							canAccessBilling={canAccessBilling}
							canAccessReview={canAccessReview}
							onStepChange={handleStepChange}
						/>

						{activeStep === "basic" && selectedPartnerId && (
							<DadosBasicos
								mode={mode}
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								control={control as any}
								selectedPartnerId={selectedPartnerId}
								locaisOptions={locaisOptions}
								isLoadingLocais={isLoadingLocais}
								onSave={handleStepOneSave}
								isSaving={isSavingBasic}
							/>
						)}

						{activeStep === "items" && (
							<SelecaoItens
								mode={mode}
								vendaId={vendaResumo?.id}
								produtosDisponiveis={dataHook.produtosDisponiveis}
								isLoadingProdutos={dataHook.isLoadingProdutos}
								produtosError={dataHook.produtosError}
								selectedLocal={selectedLocal}
								selectedProductId={selectedProductId}
								setSelectedProductId={setSelectedProductId}
								skuSearchCode={skuSearchCode}
								setSkuSearchCode={setSkuSearchCode}
								itensSelecionados={itensSelecionados}
								totals={totals}
								formatCurrency={formatCurrency}
								handlers={handlers}
								skuListingRef={skuListingRef}
								selectedSkusRef={selectedSkusRef}
								findSkuByCode={findSkuByCode}
								onBack={() => setActiveStep("basic")}
								onNext={() => setActiveStep("billing")}
							/>
						)}

						{activeStep === "billing" && (
							<FaturamentoForm
								mode={mode}
								setValue={setValue}
								watch={watch}
								onBack={() => setActiveStep("items")}
								onNext={() => setActiveStep("review")}
							/>
						)}

						{activeStep === "review" && (
							<Pagamento
								mode={mode}
								vendaResumo={vendaResumo}
								getValues={getValues}
								setValue={setValue}
								watch={watch}
								descontoTotal={descontoTotal}
								valorFrete={valorFrete}
								comissao={comissao}
								totals={totals}
								formatCurrency={formatCurrency}
								onSave={handleSavePayment}
								onFinalize={handleFinalize}
								isSaving={isSavingPayment}
								isFinalizing={isFinalizing || finalizacaoMutation.isPending}
								isSubmitting={isSubmitting}
								onBack={() => setActiveStep("billing")}
							/>
						)}
					</div>
				</FormProvider>
			</div>
		</DashboardLayout>
	);
};

export default FormularioVenda;
