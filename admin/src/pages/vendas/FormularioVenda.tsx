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
	useVendaControllerFinalizarBrindePermuta,
	useVendaControllerFinalizarCondicional,
	useVendaControllerConfirmarCondicional,
} from "@/api-client";
import type { SkuListingRef } from "@/components/SkuListing";
import type { SelectedSkusListRef } from "@/components/SelectedSkusList";

import type {
	VendaFormMode,
	VendaFormStep,
	VendaSummary,
	VendaFormHandlers,
	PagamentoFormData,
} from "./types";
import { useVendaForm } from "./hooks/useVendaForm";
import { useVendaData } from "./hooks/useVendaData";
import { useVendaMutations } from "./hooks/useVendaMutations";
import { useVendaTotals } from "./hooks/useVendaTotals";
import { useCondicionalDevolucao } from "./hooks/useCondicionalDevolucao";
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

	const [vendaResumo, setVendaResumo] = useState<VendaSummary>();

	// Se a venda já estiver finalizada, força modo "view" mesmo que a rota seja "edit"
	const effectiveMode: VendaFormMode = useMemo(() => {
		if (mode === "create") return "create";
		if (vendaResumo?.status && ["CONFIRMADA_TOTAL", "CONFIRMADA_PARCIAL"].includes(vendaResumo.status)) {
			return "view";
		}
		return mode;
	}, [mode, vendaResumo?.status]);

	const [activeStep, setActiveStep] = useState<VendaFormStep>("basic");
	const [canAccessItems, setCanAccessItems] = useState<boolean>(
		effectiveMode !== "create"
	);
	const [canAccessBilling, setCanAccessBilling] = useState<boolean>(
		effectiveMode !== "create"
	);
	const [canAccessReview, setCanAccessReview] = useState<boolean>(
		effectiveMode === "view"
	);
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
		mode: effectiveMode,
		publicId,
		setVendaResumo,
		setCanAccessItems,
		setCanAccessBilling,
		setCanAccessReview,
	});

	const watchedLocalSaidaId = watch("localSaidaId");

	// Initialize data hooks with form functions
	const dataHook = useVendaData({
		mode: effectiveMode,
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
		if (effectiveMode === "create") return;
		if (!vendaExistente || !mapVendaItemToFormData) return;
		if (hasInitializedVendaRef.current) return;

		const itens = vendaExistente.VendaItem?.map(mapVendaItemToFormData) || [];

		// Map pagamentos from API to form format
		const pagamentos: PagamentoFormData[] =
			vendaExistente.Pagamento?.map(pag => ({
				tipo: pag.tipo,
				formaPagamentoId: pag.formaPagamentoId,
				valor: pag.valor,
				entrada: pag.entrada,
				valorDelivery: pag.valorDelivery ?? undefined,
			})) || [];

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
			pagamentos,
		});

		setVendaResumo({
			id: vendaExistente.id,
			publicId: vendaExistente.publicId,
			status: vendaExistente.status,
			clienteId: vendaExistente.clienteId,
			clienteNome: vendaExistente.clienteNome,
		});
		setCanAccessItems(true);
		setCanAccessBilling(itens.length > 0);
		setCanAccessReview(effectiveMode === "view" || itens.length > 0);
		hasInitializedVendaRef.current = true;
	}, [vendaExistente, mapVendaItemToFormData, effectiveMode, formMethods]);

	// Reset initialization ref when publicId changes
	useEffect(() => {
		hasInitializedVendaRef.current = false;
	}, [publicId]);

	// Update form items when vendaExistente changes (for conditional returns)
	useEffect(() => {
		if (effectiveMode === "create") return;
		if (!vendaExistente || !mapVendaItemToFormData) return;
		if (!hasInitializedVendaRef.current) return; // Only update after initial load

		const currentItens = watch("itens");
		const newItens = vendaExistente.VendaItem?.map(mapVendaItemToFormData) || [];

		// Check if items have changed (comparing qtdDevolvida)
		const hasChanges = newItens.some((newItem, index) => {
			const currentItem = currentItens[index];
			if (!currentItem) return true;
			return (
				currentItem.qtdDevolvida !== newItem.qtdDevolvida ||
				currentItem.qtdAceita !== newItem.qtdAceita
			);
		});

		if (hasChanges) {
			replace(newItens);
		}
	}, [vendaExistente, mapVendaItemToFormData, effectiveMode, watch, replace]);

	const itensSelecionados = watch("itens");
	const descontoTotal = watch("descontoTotal");
	const valorFrete = watch("valorFrete");
	const comissao = watch("comissao");
	const tipoVenda = watch("tipo");

	// Determinar se é uma venda condicional em modo devolução (status ABERTA)
	const isCondicionalAberta = useMemo(() => {
		return tipoVenda === "CONDICIONAL" && vendaResumo?.status === "ABERTA";
	}, [tipoVenda, vendaResumo?.status]);

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
		comissao,
		isCondicionalAberta
	);

	// Determina se as abas de faturamento e pagamento devem ser mostradas
	// BRINDE e PERMUTA não precisam de faturamento/pagamento
	// CONDICIONAL com status PEDIDO também não precisa
	const shouldShowBillingAndPayment = useMemo(() => {
		if (tipoVenda === "BRINDE" || tipoVenda === "PERMUTA") {
			return false;
		}
		if (tipoVenda === "CONDICIONAL" && vendaResumo?.status === "PEDIDO") {
			return false;
		}
		return true;
	}, [tipoVenda, vendaResumo?.status]);

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
		mode: effectiveMode,
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

	// Hook para processar devoluções em vendas condicionais
	const { processarDevolucao } = useCondicionalDevolucao(
		vendaResumo?.publicId,
		parceiroIdNumber,
		itensSelecionados,
		() => {
			// Callback após devolução bem-sucedida - recarregar venda
			if (vendaResumo?.publicId) {
				queryClient.invalidateQueries({
					queryKey: vendaControllerFindOneQueryKey(vendaResumo.publicId),
				});
			}
		}
	);

	// Finalization hooks
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
			onError: error => {
				console.error("Erro ao finalizar venda:", error);
				const mensagem =
					error?.data?.message ?? t("salesOrders.form.messages.finalizeError");
				showError(mensagem);
			},
		},
	});

	const finalizacaoBrindePermutaMutation =
		useVendaControllerFinalizarBrindePermuta({
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
				onError: error => {
					console.error("Erro ao finalizar brinde/permuta:", error);
					const mensagem =
						error?.data?.message ??
						t("salesOrders.form.messages.finalizeError");
					showError(mensagem);
				},
			},
		});

	const finalizacaoCondicionalMutation =
		useVendaControllerFinalizarCondicional({
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
				onError: error => {
					console.error("Erro ao finalizar condicional:", error);
					const mensagem =
						error?.data?.message ??
						t("salesOrders.form.messages.finalizeError");
					showError(mensagem);
				},
			},
		});

	const confirmarCondicionalMutation =
		useVendaControllerConfirmarCondicional({
			mutation: {
				onSuccess: () => {
					showSuccess(t("salesOrders.form.messages.conditionalConfirmed"));
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
				onError: error => {
					console.error("Erro ao confirmar condicional:", error);
					const mensagem =
						error?.data?.message ??
						t("salesOrders.form.messages.confirmConditionalError");
					showError(mensagem);
				},
			},
		});

	// Reset selected product when location changes
	useEffect(() => {
		setSelectedProductId(null);
		setSkuSearchCode("");
	}, [selectedLocal?.publicId]);

	// Update billing and review access based on items and sale type
	useEffect(() => {
		if (effectiveMode === "view") {
			setCanAccessBilling(shouldShowBillingAndPayment);
			setCanAccessReview(true);
			return;
		}
		const hasItems = itensSelecionados.length > 0;
		// Só permite acesso ao faturamento se tiver itens E se o tipo de venda exigir
		setCanAccessBilling(hasItems && shouldShowBillingAndPayment);
		setCanAccessReview(hasItems);
	}, [itensSelecionados.length, effectiveMode, shouldShowBillingAndPayment]);

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
				clienteId: values.clienteId,
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
			// Error already handled by mutation onError handler with specific message
			console.error("Erro ao salvar dados básicos:", error);
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
				clienteId: getValues("clienteId"),
				localSaidaId: getValues("localSaidaId")!,
				tipo: getValues("tipo"),
				dataEntrega: getValues("dataEntrega"),
				observacao: getValues("observacao") || null,
			});

			showSuccess(t("salesOrders.form.messages.basicDataSaved"));
		} catch (error) {
			// Error already handled by mutation onError handler with specific message
			console.error("Erro ao salvar pagamento:", error);
		} finally {
			setIsSavingPayment(false);
		}
	}, [
		parceiroIdNumber,
		vendaResumo,
		handleCreateOrUpdateVenda,
		getValues,
		showSuccess,
		t,
	]);

	const handleFinalize = useCallback(async () => {
		const tipoVendaAtual = getValues("tipo");
		if (!parceiroIdNumber || !vendaResumo?.publicId) return;
		setIsFinalizing(true);
		try {
			// 1. Salvar dados básicos da venda
			await handleCreateOrUpdateVenda({
				clienteId: getValues("clienteId"),
				localSaidaId: getValues("localSaidaId")!,
				tipo: tipoVendaAtual,
				dataEntrega: getValues("dataEntrega"),
				observacao: getValues("observacao") || null,
				valorFrete: getValues("valorFrete"),
				descontoTotal: getValues("descontoTotal"),
				comissao: getValues("comissao"),
				numeroFatura: getValues("numeroFatura"),
				nomeFatura: getValues("nomeFatura"),
				ruccnpjFatura: getValues("ruccnpjFatura"),
			});

			// 2. Tratamento específico por tipo de venda
			if (tipoVendaAtual === "BRINDE" || tipoVendaAtual === "PERMUTA") {
				// Finalizar BRINDE ou PERMUTA sem pagamentos
				await finalizacaoBrindePermutaMutation.mutateAsync({
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
					},
				});
				return;
			}

			if (
				tipoVendaAtual === "CONDICIONAL" &&
				vendaResumo?.status === "PEDIDO"
			) {
				// Confirmar envio de condicional (baixa estoque, muda status para ABERTA)
				await confirmarCondicionalMutation.mutateAsync({
					publicId: vendaResumo.publicId,
					headers: {
						"x-parceiro-id": parceiroIdNumber,
					},
				});
				return;
			}

			// Se é CONDICIONAL com status ABERTA, finalizar após devoluções
			if (
				tipoVendaAtual === "CONDICIONAL" &&
				vendaResumo?.status === "ABERTA"
			) {
				// 3a. Validar e processar pagamentos para vendas condicionais
				const pagamentos = getValues("pagamentos") || [];

				if (pagamentos.length === 0) {
					showError("Adicione ao menos uma forma de pagamento");
					return;
				}

				// 3b. Preparar payload de finalização
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

				// 3c. Chamar endpoint de finalização de condicional
				await finalizacaoCondicionalMutation.mutateAsync({
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
						pagamentos: pagamentosPayload as any, // Tipo gerado incorretamente pelo Kubb como any[][]
					},
				});
				return;
			}

			// 3. Validar e processar pagamentos para vendas normais (DIRETA)
			const pagamentos = getValues("pagamentos") || [];

			if (pagamentos.length === 0) {
				showError("Adicione ao menos uma forma de pagamento");
				return;
			}

			// 4. Preparar payload de finalização
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

			// 5. Chamar endpoint de finalização para vendas DIRETA
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
		finalizacaoBrindePermutaMutation,
		finalizacaoCondicionalMutation,
		showError,
		showSuccess,
		queryClient,
		navigate,
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
			<div className="p-6 text-center text-muted-foreground">
				{t("common.noPartnerSelected")}
			</div>
		);
	}

	if (effectiveMode !== "create" && isLoadingVenda) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/pedidoVendas/pedidos">
							{t("menu.openOrders")}
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
							mode={effectiveMode}
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
							mode={effectiveMode}
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
							onNext={() =>
								setActiveStep(
									shouldShowBillingAndPayment ? "billing" : "review"
								)
							}
							isCondicionalAberta={isCondicionalAberta}
							onProcessarDevolucao={processarDevolucao}
						/>
					)}

					{activeStep === "billing" && (
						<FaturamentoForm
							mode={effectiveMode}
							setValue={setValue}
							watch={watch}
							onBack={() => setActiveStep("items")}
							onNext={() => setActiveStep("review")}
						/>
					)}

					{activeStep === "review" && (
						<Pagamento
								mode={effectiveMode}
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
								isFinalizing={
									isFinalizing ||
									finalizacaoMutation.isPending ||
									finalizacaoBrindePermutaMutation.isPending ||
									finalizacaoCondicionalMutation.isPending
								}
								isSubmitting={isSubmitting}
								onBack={() =>
									setActiveStep(shouldShowBillingAndPayment ? "billing" : "items")
								}
								tipoVenda={tipoVenda}
								shouldShowBillingAndPayment={shouldShowBillingAndPayment}
								valorTotalVenda={vendaExistente?.valorTotal ?? null}
								isCondicionalAberta={isCondicionalAberta}
							/>
						)}
				</div>
			</FormProvider>
		</div>
	);
};

export default FormularioVenda;
