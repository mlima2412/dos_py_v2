import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { usePartner } from "@/hooks/usePartner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useLocaisEstoque } from "@/hooks/useEstoques";
import {
	useProdutoControllerFindByLocal,
	useFornecedoresControllerFindAll,
	useCurrencyControllerFindAllActive,
	usePedidoCompraControllerCreate,
	usePedidoCompraControllerUpdate,
	usePedidoCompraControllerFindOne,
	usePedidoCompraItemControllerFindByPedidoCompra,
	pedidoCompraControllerFindAllQueryKey,
	pedidoCompraControllerFindOneQueryKey,
	pedidoCompraItemControllerFindByPedidoCompraQueryKey,
} from "@/api-client";
import {
	pedidoCompraBasicSchema,
	type PedidoCompraBasicFormData,
} from "./pedidoCompraSchema";
import { usePurchaseOrderTotals } from "./hooks/usePurchaseOrderTotals";
import { usePurchaseOrderItems } from "./hooks/usePurchaseOrderItems";
import { PurchaseOrderBasicForm } from "./components/PurchaseOrderBasicForm";
import { PurchaseOrderDetailsCard } from "./components/PurchaseOrderDetailsCard";
import { PurchaseOrderValuesCard } from "./components/PurchaseOrderValuesCard";
import { ProductSkuPickerCard } from "./components/ProductSkuPickerCard";
import { SelectedSkusCard } from "./components/SelectedSkusCard";
import {
	parseToNumber,
	optionalNumber,
	numberToInputString,
} from "./utils/numberUtils";
import {
	formatCurrencyFromString,
	formatCurrencyForPartner,
} from "./utils/currencyUtils";
import type { SelectedSkuItem } from "./types";

import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
	Fornecedor,
	Currency,
	PedidoCompra,
	CreatePedidoCompraDto,
	UpdatePedidoCompraDto,
	PedidoCompraItem,
} from "@/api-client/types";

export const FormularioPedidoCompra: React.FC = () => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { publicId } = useParams<{ publicId?: string }>();
	const queryClient = useQueryClient();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartner();
	const [isEditing, setIsEditing] = useState(!publicId);
	const [savedData, setSavedData] = useState<PedidoCompraBasicFormData | null>(
		null
	);
	const [pedidoAtual, setPedidoAtual] = useState<PedidoCompra | null>(null);

	// Estados para seleção de local e produtos
	const [localEntradaId, setLocalEntradaId] = useState<number | null>(null);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);

	const parceiroIdNumber = selectedPartnerId ? Number(selectedPartnerId) : null;

	const {
		data: pedidoData,
		isLoading: isLoadingPedido,
		error: errorPedido,
	} = usePedidoCompraControllerFindOne(
		publicId ?? "",
		{ "x-parceiro-id": parceiroIdNumber ?? 0 },
		{
			query: {
				enabled: !!(publicId && parceiroIdNumber),
				refetchOnMount: "always",
				staleTime: 0,
			},
		}
	);

	const fornecedoresHeaders = useMemo(
		() => ({
			"x-parceiro-id": parceiroIdNumber?.toString() ?? "",
		}),
		[parceiroIdNumber]
	);

	const isFornecedorLocked = useMemo(
		() => Boolean(pedidoAtual?.id),
		[pedidoAtual]
	);

	const isCotacaoLocked = isFornecedorLocked; // trava cotação após criar o pedido
	const isCurrencyLocked = isFornecedorLocked; // trava moeda após criar o pedido

	const { data: fornecedoresData, isLoading: isLoadingFornecedores } =
		useFornecedoresControllerFindAll(fornecedoresHeaders, {
			query: {
				enabled: !!parceiroIdNumber,
			},
		});

	const fornecedores = useMemo<Fornecedor[]>(
		() => fornecedoresData ?? [],
		[fornecedoresData]
	);

	const { data: currenciesData, isLoading: isLoadingCurrencies } =
		useCurrencyControllerFindAllActive();

	const currencies = useMemo<Currency[]>(
		() => currenciesData ?? [],
		[currenciesData]
	);

	// Buscar locais de estoque do parceiro selecionado
	const { data: locaisData, isLoading: isLoadingLocations } = useLocaisEstoque({
		parceiroId: selectedPartnerId ? Number(selectedPartnerId) : undefined,
	});

	// Flatten dos dados de locais
	const locais = useMemo(() => {
		return (
			locaisData?.pages.flatMap(page => page.data || []).filter(Boolean) || []
		);
	}, [locaisData]);

	// Buscar produtos do local de entrada selecionado
	const {
		data: produtosData,
		isLoading: isLoadingProducts,
		error: errorProducts,
	} = useProdutoControllerFindByLocal(
		locais.find(loc => loc.id === localEntradaId)?.publicId || "",
		{
			"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
		},
		{
			apenasComEstoque: false, // Para pedido de compra, mostrar todos os produtos
		},
		{
			query: {
				enabled: !!localEntradaId && !!selectedPartnerId,
			},
		}
	);

	// Obter SKUs do produto selecionado
	const selectedProductSkus = useMemo(() => {
		if (!selectedProductId || !produtosData) return [];

		const selectedProduct = produtosData.find(
			(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
		);

		return selectedProduct?.ProdutoSKU || [];
	}, [selectedProductId, produtosData]);

	const selectedProductBase = useMemo(() => {
		if (!selectedProductId || !produtosData) return null;
		return (
			produtosData.find(
				(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
			) || null
		);
	}, [selectedProductId, produtosData]);

	const skuProductMap = useMemo(() => {
		const map = new Map<
			number,
			{
				product: ProdutosPorLocalResponseDto;
				sku: ProdutoSKUEstoqueResponseDto;
			}
		>();
		if (!produtosData) return map;
		produtosData.forEach(product => {
			(product.ProdutoSKU || []).forEach(skuItem => {
				map.set(skuItem.id, { product, sku: skuItem });
			});
		});
		return map;
	}, [produtosData]);

	const buildSelectedSkuFromItem = React.useCallback(
		(item: PedidoCompraItem): SelectedSkuItem => {
			const mapping = skuProductMap.get(item.skuId);
			const unitPriceNumber = parseToNumber(item.precoCompra);
			const unitPrice = Number.isNaN(unitPriceNumber)
				? (mapping?.product.precoCompra ?? 0)
				: unitPriceNumber;

			const skuInfo: ProdutoSKUEstoqueResponseDto = mapping
				? { ...mapping.sku }
				: {
						id: item.skuId,
						publicId: String(item.skuId),
						cor: "",
						tamanho: "",
						codCor: 0,
						qtdMinima: 0,
						estoque: 0,
					};

			const productInfo = mapping
				? {
						id: mapping.product.id,
						nome: mapping.product.nome,
						precoCompra: unitPrice,
						currency: mapping.product.currency,
					}
				: {
						id: 0,
						nome: t("common.unknownProduct", { defaultValue: "Produto" }),
						precoCompra: unitPrice,
						currency: undefined,
					};

			return {
				itemId: item.id,
				sku: skuInfo,
				product: productInfo,
				quantity: item.qtd,
				unitPrice,
			};
		},
		[skuProductMap, t, parseToNumber]
	);

	const pedidoIdForItems = pedidoAtual?.id ?? pedidoData?.id;
	const pedidoPublicId = pedidoAtual?.publicId ?? publicId ?? null;

	const pedidoQueryKey = useMemo(() => {
		if (!pedidoPublicId) return null;
		return pedidoCompraControllerFindOneQueryKey(pedidoPublicId);
	}, [pedidoPublicId]);

	const { data: pedidoItensData, isLoading: isLoadingItens } =
		usePedidoCompraItemControllerFindByPedidoCompra(
			pedidoIdForItems ? pedidoIdForItems.toString() : "",
			{ "x-parceiro-id": parceiroIdNumber ?? 0 },
			{
				query: {
					enabled: !!(pedidoIdForItems && parceiroIdNumber),
					refetchOnMount: "always",
					staleTime: 0,
				},
			}
		);

	const form = useForm<PedidoCompraBasicFormData>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(pedidoCompraBasicSchema) as any,
		defaultValues: {
			fornecedorId: "",
			localEntradaId: localEntradaId?.toString() || "",
			currencyId: "",
			valorFrete: "",
			observacao: "",
			valorComissao: "",
			cotacao: "1.00",
			consignado: false,
		},
	});

	const selectedSkusRef = React.useRef<SelectedSkuItem[]>([]);

	// Mantém uma referência estável para leitura dos itens selecionados
	const getItems = React.useCallback(() => selectedSkusRef.current, []);

	const {
		valorTotalOriginal,
		valorTotalConvertido,
		resolveTotalsFromData,
		updateTotalsState,
		refreshTotals,
	} = usePurchaseOrderTotals({
		form,
		getItems,
	});

	const updatePedidoTotalsMutation = usePedidoCompraControllerUpdate({
		mutation: {
			onSuccess: data => {
				setPedidoAtual(data);
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.updateTotalsError", {
						defaultValue: "Não foi possível atualizar os totais do pedido.",
					})
				);
			},
		},
	});

	const persistTotals = React.useCallback(
		(items: SelectedSkuItem[]) => {
			const currentValues = form.getValues();
			const totals = updateTotalsState(items, currentValues);

			if (!pedidoPublicId || !parceiroIdNumber) {
				return;
			}

			updatePedidoTotalsMutation.mutate(
				{
					publicId: pedidoPublicId,
					headers: { "x-parceiro-id": parceiroIdNumber },
					data: {
						valorFrete: totals.valorFrete,
						valorComissao: totals.valorComissao,
						valorTotal: Number(totals.totalOriginal.toFixed(2)),
						cotacao: totals.cotacao,
					},
				},
				{
					onSuccess: data => {
						setPedidoAtual(data);
						updateTotalsState(selectedSkusRef.current, currentValues);
					},
					onSettled: () => {
						queryClient.invalidateQueries({
							queryKey: pedidoCompraControllerFindAllQueryKey(),
						});
						if (pedidoPublicId) {
							queryClient.invalidateQueries({
								queryKey: pedidoCompraControllerFindOneQueryKey(pedidoPublicId),
							});
						}
					},
				}
			);
		},
		[
			form,
			parceiroIdNumber,
			pedidoPublicId,
			queryClient,
			updatePedidoTotalsMutation,
			updateTotalsState,
		]
	);

	const itensQueryKey = useMemo(() => {
		if (!pedidoIdForItems) return null;
		return pedidoCompraItemControllerFindByPedidoCompraQueryKey(
			pedidoIdForItems.toString()
		);
	}, [pedidoIdForItems]);

	const invalidateItensQuery = React.useCallback(() => {
		if (!itensQueryKey) return;
		queryClient.invalidateQueries({ queryKey: itensQueryKey });
	}, [itensQueryKey, queryClient]);

	const {
		selectedSkus,
		adjustedPrices,
		handleAddSkuToPurchase,
		handleRemoveSku,
		handleUpdateQuantity,
		handlePriceChange,
		clearSelectedItems,
	} = usePurchaseOrderItems({
		partnerId: parceiroIdNumber,
		pedidoAtual,
		pedidoIdForItems,
		pedidoItensData,
		isLoadingItens,
		buildSelectedSkuFromItem,
		persistTotals,
		updateTotalsState,
		invalidateItensQuery,
		t,
		isPersistingTotals: updatePedidoTotalsMutation.isPending,
		selectedSkusRef,
	});

	const selectedProduct = useMemo(() => {
		if (!selectedProductBase) return null;
		const adjustedPrice =
			selectedProductId !== null && adjustedPrices[selectedProductId] !== undefined
				? adjustedPrices[selectedProductId]
				: selectedProductBase.precoCompra;
		return {
			...selectedProductBase,
			precoCompra: adjustedPrice,
		};
	}, [selectedProductBase, selectedProductId, adjustedPrices]);

	const handleSkuAddition = React.useCallback(
		(sku: ProdutoSKUEstoqueResponseDto) => {
			handleAddSkuToPurchase(sku, {
				selectedProduct,
				selectedProductId,
			});
		},
		[handleAddSkuToPurchase, selectedProduct, selectedProductId]
	);

	const handleProductPriceUpdate = React.useCallback(
		(newPrice: number) => {
			handlePriceChange(selectedProductId, newPrice);
		},
		[handlePriceChange, selectedProductId]
	);

	// Calcular valores totais quando os dados mudam
	const valorFrete = form.watch("valorFrete");
	const valorComissao = form.watch("valorComissao");
	const cotacao = form.watch("cotacao");

	useEffect(() => {
		refreshTotals();
	}, [valorFrete, valorComissao, cotacao, selectedSkus, refreshTotals]);

	// Limpar seleções APENAS quando o local realmente muda durante edição
	const prevLocalEntradaIdRef = React.useRef<number | null>(null);
	useEffect(() => {
		const prev = prevLocalEntradaIdRef.current;
		// Atualiza a referência sempre
		prevLocalEntradaIdRef.current = localEntradaId;
		// Só limpa se estiver editando e houver mudança real de local
		if (!isEditing) return;
		if (prev !== null && localEntradaId !== null && prev !== localEntradaId) {
			setSelectedProductId(null);
			clearSelectedItems();
		}
	}, [localEntradaId, clearSelectedItems, isEditing]);

	const onSubmit = (data: PedidoCompraBasicFormData) => {
		if (!selectedPartnerId) {
			toast.error(t("common.noPartnerSelected"));
			return;
		}

		// Usar o localEntradaId do formulário em vez do estado
		const formLocalEntradaId = Number(data.localEntradaId);
		if (!formLocalEntradaId) {
			toast.error("Por favor, selecione um local de entrada.");
			return;
		}

		const payload = buildPedidoPayload(data);
		const headers = { "x-parceiro-id": Number(selectedPartnerId) };

		if (!pedidoAtual) {
			createPedidoMutation.mutate({
				data: payload,
				headers,
			});
		} else {
			const updatePayload: UpdatePedidoCompraDto = { ...payload };
			updatePedidoMutation.mutate({
				publicId: pedidoAtual.publicId,
				headers,
				data: updatePayload,
			});
		}
	};

	const handleCancel = () => {
		navigate("/pedidoCompra");
	};

	const handleEdit = () => {
		setIsEditing(true);
		// Resetar o formulário com os dados salvos
		const dataToReset = displayData;
		if (dataToReset) {
			form.reset(dataToReset);
			setLocalEntradaId(Number(dataToReset.localEntradaId));
		}
	};

	// Funções auxiliares para obter dados dos selects
	const getSupplierName = (id: string) => {
		if (!id) return "";
		const supplier = fornecedores.find(s => s.id?.toString() === id);
		return supplier?.nome || "";
	};

	const getLocationName = (id: string) => {
		if (!id) return "";
		const location = locais.find(local => local.id?.toString() === id);
		return location?.nome || "";
	};

	// Função para formatar valores monetários
	const formatCurrency = (value: string, currencyId: string) => {
		if (!currencyId) return value;
		const currency = currencies.find(c => c.id?.toString() === currencyId);
		if (!currency) return value;

		return formatCurrencyFromString(value, {
			locale: currency.locale,
			currency: currency.isoCode,
		});
	};

	// Função para formatar valores na moeda do parceiro
	const formatPartnerCurrency = (value: string) => {
		return formatCurrencyForPartner(
			value,
			selectedPartnerLocale,
			selectedPartnerIsoCode
		);
	};

	const mapPedidoToFormData = React.useCallback(
		(pedido: PedidoCompra): PedidoCompraBasicFormData => ({
			fornecedorId: pedido.fornecedorId?.toString() || "",
			localEntradaId: pedido.localEntradaId?.toString() || "",
			currencyId: pedido.currencyId?.toString() || "",
			valorFrete: numberToInputString(pedido.valorFrete),
			observacao: pedido.observacao || "",
			valorComissao: numberToInputString(pedido.valorComissao),
			cotacao: numberToInputString(pedido.cotacao) || "1",
			consignado: pedido.consignado ?? false,
		}),
		[numberToInputString]
	);

	const buildPedidoPayload = (values: PedidoCompraBasicFormData) => {
		const payload: CreatePedidoCompraDto = {
			localEntradaId: Number(values.localEntradaId),
			fornecedorId: Number(values.fornecedorId),
			currencyId: Number(values.currencyId),
			consignado: values.consignado,
			cotacao: optionalNumber(values.cotacao) ?? 1,
			observacao: values.observacao || undefined,
		};

		const valorFreteNumber = optionalNumber(values.valorFrete);
		if (valorFreteNumber !== undefined) {
			payload.valorFrete = valorFreteNumber;
		}

		const valorComissaoNumber = optionalNumber(values.valorComissao);
		if (valorComissaoNumber !== undefined) {
			payload.valorComissao = valorComissaoNumber;
		}

		const totals = resolveTotalsFromData(values, selectedSkus);
		payload.valorTotal = Number(totals.totalOriginal.toFixed(2));

		return payload;
	};

	const createPedidoMutation = usePedidoCompraControllerCreate({
		mutation: {
			onSuccess: data => {
				const formData = mapPedidoToFormData(data);
				setPedidoAtual(data);
				setSavedData(formData);
				form.reset(formData);
				setLocalEntradaId(data.localEntradaId ?? null);
				updateTotalsState(selectedSkusRef.current, formData);
				toast.success(t("purchaseOrders.form.messages.createSuccess"));
				setIsEditing(false);
			},
			onError: () => {
				toast.error(t("purchaseOrders.form.messages.createError"));
			},
		},
	});

	const updatePedidoMutation = usePedidoCompraControllerUpdate({
		mutation: {
			onSuccess: data => {
				const currentValues = form.getValues();
				const formData = mapPedidoToFormData(data);
				const mergedData: PedidoCompraBasicFormData = {
					...formData,
					valorFrete: currentValues.valorFrete ?? formData.valorFrete,
					valorComissao: currentValues.valorComissao ?? formData.valorComissao,
					cotacao: currentValues.cotacao ?? formData.cotacao,
					observacao: currentValues.observacao ?? formData.observacao,
					localEntradaId: formData.localEntradaId,
					fornecedorId: formData.fornecedorId,
					currencyId: formData.currencyId,
					consignado: currentValues.consignado ?? formData.consignado,
				};
				setPedidoAtual(data);
				setSavedData(mergedData);
				form.reset(mergedData);
				setLocalEntradaId(data.localEntradaId ?? null);
				updateTotalsState(selectedSkusRef.current, mergedData);
				// Garante dados consistentes após salvar
				invalidateItensQuery();
				toast.success(
					t("purchaseOrders.form.messages.updateSuccess", {
						defaultValue: "Pedido atualizado com sucesso.",
					})
				);
				setIsEditing(false);
				if (pedidoQueryKey) {
					queryClient.invalidateQueries({ queryKey: pedidoQueryKey });
				}
				queryClient.invalidateQueries({
					queryKey: pedidoCompraControllerFindAllQueryKey(),
				});
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.updateError", {
						defaultValue: "Não foi possível atualizar o pedido.",
					})
				);
			},
		},
	});

	const isSaving =
		createPedidoMutation.isPending || updatePedidoMutation.isPending;

	useEffect(() => {
		if (!pedidoData) return;

		const formData = mapPedidoToFormData(pedidoData);
		setPedidoAtual(pedidoData);
		setSavedData(formData);
		if (!isEditing) {
			form.reset(formData);
			setLocalEntradaId(pedidoData.localEntradaId ?? null);
		}
		updateTotalsState(selectedSkusRef.current, formData);
		if (publicId) {
			setIsEditing(prev => (prev ? prev : false));
		}
	}, [
		pedidoData,
		form,
		isEditing,
		publicId,
		mapPedidoToFormData,
		updateTotalsState,
	]);

	const displayData = useMemo<PedidoCompraBasicFormData | null>(() => {
		if (savedData) return savedData;
		if (pedidoAtual) return mapPedidoToFormData(pedidoAtual);
		return null;
	}, [savedData, pedidoAtual, mapPedidoToFormData]);

	const supplierNameDisplay = displayData
		? getSupplierName(displayData.fornecedorId)
		: "";
	const locationNameDisplay = displayData
		? getLocationName(displayData.localEntradaId)
		: "";
	const formattedFreightDisplay =
		displayData?.valorFrete && displayData.currencyId
			? formatCurrency(displayData.valorFrete, displayData.currencyId)
			: formatCurrencyFromString(displayData?.valorFrete ?? "0");
	const formattedCommissionDisplay =
		displayData?.valorComissao && displayData.currencyId
			? formatCurrency(displayData.valorComissao, displayData.currencyId)
			: formatCurrencyFromString(displayData?.valorComissao ?? "0");
	const formattedOriginalValue = displayData?.currencyId
		? formatCurrency(valorTotalOriginal, displayData.currencyId)
		: formatCurrencyFromString(valorTotalOriginal);
	const formattedConvertedValue = formatPartnerCurrency(
		valorTotalConvertido || "0"
	);
	const detailsCardTitle = t("purchaseOrders.form.sections.details", {
		defaultValue: "Dados do Pedido",
	});
	const supplierLabel = t("purchaseOrders.form.labels.supplier");
	const locationLabel = t("purchaseOrders.form.labels.entryLocation");
	const freightLabel = t("purchaseOrders.form.labels.freightValue");
	const commissionLabel = t("purchaseOrders.form.labels.commissionValue");
	const observationLabel = t("purchaseOrders.form.labels.observation");
	const editLabelText = t("common.edit", { defaultValue: "Editar" });
	const originalValueLabel = t("purchaseOrders.form.labels.originalValue", {
		defaultValue: "Valor Original",
	});
	const totalValueLabel = t("purchaseOrders.form.labels.totalValue", {
		defaultValue: "Valor Total",
	});
	const productSkuPickerLabels = useMemo(
		() => ({
			productSkus: t("purchaseOrders.form.labels.productSkus"),
			doubleClickToAdd: t("purchaseOrders.form.doubleClickToAdd"),
		}),
		[t]
	);
	const selectedProductsTitle = t(
		"purchaseOrders.form.labels.selectedProducts"
	);
	const selectedProductsEmpty = t("purchaseOrders.form.noProductsSelected");
	const selectEntryLocationMessage = t(
		"purchaseOrders.form.selectEntryLocation"
	);
	const supplierInfoFallback = "-";

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

	if (publicId && isLoadingPedido && !pedidoAtual) {
		return (
			<DashboardLayout>
				<div className="text-center">
					<p className="text-muted-foreground">{t("common.loading")}</p>
				</div>
			</DashboardLayout>
		);
	}

	if (publicId && errorPedido && !pedidoAtual) {
		return (
			<DashboardLayout>
				<div className="text-center space-y-2">
					<p className="text-destructive">
						{t("purchaseOrders.form.messages.loadError", {
							defaultValue: "Não foi possível carregar o pedido de compra.",
						})}
					</p>
					<Button variant="outline" onClick={() => navigate("/pedidoCompra")}>
						{t("common.back", { defaultValue: "Voltar" })}
					</Button>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			{/* Breadcrumb */}
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/inicio">
							{t("purchaseOrders.form.breadcrumb.home")}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/pedidoCompra">
							{t("purchaseOrders.form.breadcrumb.purchaseOrders")}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>
							{t("purchaseOrders.form.breadcrumb.new")}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* Formulário */}
			{!isEditing && displayData ? (
				// Modo de visualização - Layout com cards
				<div className="space-y-6 mt-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<PurchaseOrderDetailsCard
							title={detailsCardTitle}
							supplierLabel={supplierLabel}
							locationLabel={locationLabel}
							freightLabel={freightLabel}
							commissionLabel={commissionLabel}
							observationLabel={observationLabel}
							onEdit={handleEdit}
							supplierName={supplierNameDisplay}
							locationName={locationNameDisplay}
							supplierInfoFallback={supplierInfoFallback}
							formattedFreight={formattedFreightDisplay}
							formattedCommission={formattedCommissionDisplay}
							observation={displayData.observacao}
							editLabel={editLabelText}
						/>
						<PurchaseOrderValuesCard
							originalLabel={originalValueLabel}
							totalLabel={totalValueLabel}
							formattedOriginal={formattedOriginalValue}
							formattedTotal={formattedConvertedValue}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<ProductSkuPickerCard
							isLocationSelected={Boolean(localEntradaId)}
							selectLocationMessage={selectEntryLocationMessage}
							products={produtosData || []}
							selectedProductId={selectedProductId}
							onProductSelect={setSelectedProductId}
							isLoadingProducts={isLoadingProducts}
							errorProducts={errorProducts}
							selectedProduct={selectedProduct}
							skus={selectedProductSkus}
							onAddSku={handleSkuAddition}
							onPriceChange={handleProductPriceUpdate}
							labels={productSkuPickerLabels}
						/>

						<SelectedSkusCard
							selectedSkus={selectedSkus}
							onRemoveSku={handleRemoveSku}
							onUpdateQuantity={handleUpdateQuantity}
							emptyMessage={selectedProductsEmpty}
							title={selectedProductsTitle}
						/>
					</div>
				</div>
			) : (
				// Modo de edição - Apenas formulário básico
				<Card>
					<CardContent className="pt-6">
							<PurchaseOrderBasicForm
								form={form}
								fornecedores={fornecedores}
								locais={locais}
								currencies={currencies}
								isLoadingFornecedores={isLoadingFornecedores}
								isLoadingLocations={isLoadingLocations}
								isLoadingCurrencies={isLoadingCurrencies}
								isFornecedorLocked={isFornecedorLocked}
								isCotacaoLocked={isCotacaoLocked}
								isCurrencyLocked={isCurrencyLocked}
								parceiroIdNumber={parceiroIdNumber}
								onSubmit={onSubmit}
								onCancel={handleCancel}
								onLocalChange={setLocalEntradaId}
								refreshTotals={refreshTotals}
								isSaving={isSaving}
								t={t}
							/>
					</CardContent>
				</Card>
			)}
		</DashboardLayout>
	);
};
