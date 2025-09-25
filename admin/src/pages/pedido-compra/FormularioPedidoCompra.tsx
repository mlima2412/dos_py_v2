import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { usePartner } from "@/hooks/usePartner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
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
import { Edit } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import { useLocaisEstoque } from "@/hooks/useEstoques";
import {
	useProdutoControllerFindByLocal,
	useFornecedoresControllerFindAll,
	useCurrencyControllerFindAllActive,
	usePedidoCompraControllerCreate,
	usePedidoCompraControllerUpdate,
	usePedidoCompraControllerFindOne,
	usePedidoCompraItemControllerFindByPedidoCompra,
	usePedidoCompraItemControllerCreate,
	usePedidoCompraItemControllerUpdate,
	usePedidoCompraItemControllerRemove,
	pedidoCompraControllerFindAllQueryKey,
	pedidoCompraControllerFindOneQueryKey,
	pedidoCompraItemControllerFindByPedidoCompraQueryKey,
} from "@/api-client";
import {
	pedidoCompraBasicSchema,
	type PedidoCompraBasicFormData,
} from "./pedidoCompraSchema";
import { SkuListing } from "@/components/SkuListing";
import { ProductSelector, SelectedSkusList } from "@/components";

import type {
	LocalEstoque,
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
	Fornecedor,
	Currency,
	PedidoCompra,
	CreatePedidoCompraDto,
	UpdatePedidoCompraDto,
	PedidoCompraItem,
} from "@/api-client/types";

type SelectedSkuItem = {
	itemId?: number;
	sku: ProdutoSKUEstoqueResponseDto;
	product: {
		id: number;
		nome: string;
		precoCompra: number;
	};
	quantity: number;
	unitPrice: number;
};

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
	const [valorTotalOriginal, setValorTotalOriginal] = useState<string>("0.00");
	const [valorTotalConvertido, setValorTotalConvertido] =
		useState<string>("0.00");

	// Estados para seleção de local e produtos
	const [localEntradaId, setLocalEntradaId] = useState<number | null>(null);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);

	// Estado para SKUs selecionados para compra
	const [selectedSkus, setSelectedSkus] = useState<SelectedSkuItem[]>([]);
	const selectedSkusRef = React.useRef<SelectedSkuItem[]>([]);

	useEffect(() => {
		selectedSkusRef.current = selectedSkus;
	}, [selectedSkus]);

	// Estado para controlar preços ajustados dos produtos
	const [adjustedPrices, setAdjustedPrices] = useState<Record<number, number>>(
		{}
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

	// Encontrar o produto selecionado
	const selectedProductBase =
		produtosData?.find(
			(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
		) || null;

	// Criar uma versão do produto com preço ajustado se disponível
	const selectedProduct = selectedProductBase
		? {
				...selectedProductBase,
				precoCompra:
					(selectedProductId && adjustedPrices[selectedProductId]) ||
					selectedProductBase.precoCompra,
			}
		: null;

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

	const parseToNumber = React.useCallback((raw: unknown): number => {
		if (raw === null || raw === undefined) {
			return Number.NaN;
		}
		if (typeof raw === "number") {
			return Number.isFinite(raw) ? raw : Number.NaN;
		}
		if (typeof raw === "string") {
			if (raw.trim() === "") return Number.NaN;
			const direct = Number(raw);
			if (!Number.isNaN(direct)) {
				return direct;
			}
			const normalized = raw.replace(/\./g, "").replace(",", ".");
			const normalizedNumber = Number(normalized);
			return Number.isNaN(normalizedNumber) ? Number.NaN : normalizedNumber;
		}
		if (
			typeof raw === "object" &&
			"value" in (raw as Record<string, unknown>)
		) {
			return parseToNumber((raw as Record<string, unknown>).value);
		}
		return Number.NaN;
	}, []);

	const safeNumber = React.useCallback(
		(raw: unknown, fallback = 0) => {
			const parsed = parseToNumber(raw);
			return Number.isNaN(parsed) ? fallback : parsed;
		},
		[parseToNumber]
	);

	const computeConvertedTotal = React.useCallback(
		(originalRaw: unknown, cotacaoRaw: unknown) => {
			const original = safeNumber(originalRaw, 0);
			const cotacao = safeNumber(cotacaoRaw ?? 1, 1);
			return original * cotacao;
		},
		[safeNumber]
	);

	const resolveTotalsFromData = React.useCallback(
		(values: Partial<PedidoCompraBasicFormData>, items: SelectedSkuItem[]) => {
			const valorFreteNumber = parseToNumber(values.valorFrete ?? "0");
			const valorComissaoNumber = parseToNumber(values.valorComissao ?? "0");
			const cotacaoNumber = parseToNumber(values.cotacao ?? "1");

			const valorFrete = Number.isNaN(valorFreteNumber) ? 0 : valorFreteNumber;
			const valorComissao = Number.isNaN(valorComissaoNumber)
				? 0
				: valorComissaoNumber;
			const cotacao = Number.isNaN(cotacaoNumber) ? 1 : cotacaoNumber;

			const valorProdutos = items.reduce((total, item) => {
				return total + item.unitPrice * item.quantity;
			}, 0);

			const totalOriginal = valorFrete + valorComissao + valorProdutos;
			const totalConvertido = totalOriginal * cotacao;

			return {
				valorFrete,
				valorComissao,
				cotacao,
				valorProdutos,
				totalOriginal,
				totalConvertido,
			};
		},
		[parseToNumber]
	);

	const updateTotalsState = React.useCallback(
		(
			itemsArg?: SelectedSkuItem[],
			valuesArg?: Partial<PedidoCompraBasicFormData>
		) => {
			const currentItems = itemsArg ?? selectedSkusRef.current;
			const currentValues = valuesArg ?? form.getValues();
			const totals = resolveTotalsFromData(currentValues, currentItems);
			setValorTotalOriginal(totals.totalOriginal.toFixed(2));
			setValorTotalConvertido(totals.totalConvertido.toFixed(2));
			return totals;
		},
		[form, resolveTotalsFromData]
	);

	const refreshTotals = React.useCallback(
		(patch?: Partial<PedidoCompraBasicFormData>) => {
			const baseValues = form.getValues();
			const mergedValues = patch ? { ...baseValues, ...patch } : baseValues;
			updateTotalsState(selectedSkusRef.current, mergedValues);
		},
		[form, updateTotalsState]
	);

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

	// Função para adicionar SKU à lista de compra
	const handleAddSkuToPurchase = (sku: ProdutoSKUEstoqueResponseDto) => {
		if (isMutatingItems) return;
		if (!selectedProduct) return;
		if (!pedidoAtual || !pedidoAtual.id) {
			toast.warn(
				t("purchaseOrders.form.messages.saveBeforeAdding", {
					defaultValue: "Salve o pedido antes de adicionar itens.",
				})
			);
			return;
		}
		if (!parceiroIdNumber) {
			toast.error(t("common.noPartnerSelected"));
			return;
		}

		const existingItem = selectedSkus.find(item => item.sku.id === sku.id);

		if (existingItem && existingItem.itemId) {
			const previousItems = selectedSkus.map(selected => ({
				...selected,
				product: { ...selected.product },
				sku: { ...selected.sku },
			}));
			const newQuantity = existingItem.quantity + 1;
			const nextItems = previousItems.map(item =>
				item.sku.id === sku.id ? { ...item, quantity: newQuantity } : item
			);
			setSelectedSkus(nextItems);
			updateTotalsState(nextItems);
			updateItemMutation.mutate(
				{
					id: existingItem.itemId.toString(),
					headers: { "x-parceiro-id": parceiroIdNumber },
					data: {
						qtd: newQuantity,
						precoCompra: existingItem.unitPrice,
					},
				},
				{
					onError: () => {
						setSelectedSkus(previousItems);
						updateTotalsState(previousItems);
					},
				}
			);
			return;
		}

		const unitPrice =
			(selectedProductId && adjustedPrices[selectedProductId]) ??
			selectedProduct.precoCompra ??
			0;

		createItemMutation.mutate({
			data: {
				pedidoCompraId: pedidoAtual.id,
				skuId: sku.id,
				qtd: 1,
				precoCompra: unitPrice,
			},
			headers: { "x-parceiro-id": parceiroIdNumber },
		});
	};

	// Função para remover SKU da lista de compra
	const handleRemoveSku = (skuId: number) => {
		if (isMutatingItems) return;
		const item = selectedSkus.find(selected => selected.sku.id === skuId);
		if (!item) return;

		if (!item.itemId || !parceiroIdNumber) {
			setSelectedSkus(prev =>
				prev.filter(selected => selected.sku.id !== skuId)
			);
			return;
		}

		removeItemMutation.mutate({
			id: item.itemId.toString(),
			headers: { "x-parceiro-id": parceiroIdNumber },
		});
	};

	// Função para atualizar quantidade de um SKU
	const handleUpdateQuantity = (skuId: number, quantity: number) => {
		if (isMutatingItems) return;
		const item = selectedSkus.find(selected => selected.sku.id === skuId);
		if (!item) return;

		const previousItems = selectedSkus.map(selected => ({
			...selected,
			product: { ...selected.product },
			sku: { ...selected.sku },
		}));
		const nextItems = previousItems.map(selected =>
			selected.sku.id === skuId ? { ...selected, quantity } : selected
		);
		setSelectedSkus(nextItems);
		updateTotalsState(nextItems);

		if (!item.itemId || !parceiroIdNumber) {
			return;
		}

		updateItemMutation.mutate(
			{
				id: item.itemId.toString(),
				headers: { "x-parceiro-id": parceiroIdNumber },
				data: {
					qtd: quantity,
					precoCompra: item.unitPrice,
				},
			},
			{
				onError: () => {
					setSelectedSkus(previousItems);
					updateTotalsState(previousItems);
				},
			}
		);
	};

	// Calcular valores totais quando os dados mudam
	const valorFrete = form.watch("valorFrete");
	const valorComissao = form.watch("valorComissao");
	const cotacao = form.watch("cotacao");

	useEffect(() => {
		refreshTotals();
	}, [valorFrete, valorComissao, cotacao, selectedSkus, refreshTotals]);

	// Limpar seleções quando mudar o local de entrada
	useEffect(() => {
		setSelectedProductId(null);
		setSelectedSkus([]);
	}, [localEntradaId]);

	// Limpar seleção de produto quando mudar
	useEffect(() => {
		setSelectedProductId(null);
	}, [localEntradaId]);

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

		const numericValue = parseToNumber(value ?? "0");
		const safeValue = Number.isNaN(numericValue) ? 0 : numericValue;
		return new Intl.NumberFormat(currency.locale || "pt-BR", {
			style: "currency",
			currency: currency.isoCode,
		}).format(safeValue);
	};

	// Função para formatar valores na moeda do parceiro
	const formatPartnerCurrency = (value: string) => {
		if (!selectedPartnerLocale || !selectedPartnerIsoCode) return value;

		const numericValue = parseToNumber(value ?? "0");
		const safeValue = Number.isNaN(numericValue) ? 0 : numericValue;
		return new Intl.NumberFormat(selectedPartnerLocale, {
			style: "currency",
			currency: selectedPartnerIsoCode,
		}).format(safeValue);
	};

	const optionalNumber = React.useCallback(
		(raw?: string) => {
			if (raw === undefined || raw === null) return undefined;
			if (raw === "") return undefined;
			const parsed = parseToNumber(raw);
			return Number.isNaN(parsed) ? undefined : parsed;
		},
		[parseToNumber]
	);

	const numberToInputString = React.useCallback(
		(raw: unknown) => {
			const parsed = parseToNumber(raw);
			return Number.isNaN(parsed) ? "" : parsed.toString();
		},
		[parseToNumber]
	);

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
					}
				: {
						id: 0,
						nome: t("common.unknownProduct", { defaultValue: "Produto" }),
						precoCompra: unitPrice,
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

	const createPedidoMutation = usePedidoCompraControllerCreate({
		mutation: {
			onSuccess: data => {
				const formData = mapPedidoToFormData(data);
				setPedidoAtual(data);
				setSavedData(formData);
				form.reset(formData);
				setLocalEntradaId(data.localEntradaId ?? null);
				const totalOriginalNumber = safeNumber(data.valorTotal, 0);
				const convertedNumber = computeConvertedTotal(
					totalOriginalNumber,
					formData.cotacao ?? "1"
				);
				setValorTotalOriginal(totalOriginalNumber.toFixed(2));
				setValorTotalConvertido(convertedNumber.toFixed(2));
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
				const totalOriginalNumber = safeNumber(data.valorTotal, 0);
				const cotacaoValue = mergedData.cotacao ?? currentValues.cotacao ?? "1";
				const convertedNumber = computeConvertedTotal(
					totalOriginalNumber,
					cotacaoValue
				);
				setValorTotalOriginal(totalOriginalNumber.toFixed(2));
				setValorTotalConvertido(convertedNumber.toFixed(2));
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
		const totalOriginalNumber = safeNumber(pedidoData.valorTotal, 0);
		const convertedNumber = computeConvertedTotal(
			totalOriginalNumber,
			formData.cotacao ?? "1"
		);
		setValorTotalOriginal(totalOriginalNumber.toFixed(2));
		setValorTotalConvertido(convertedNumber.toFixed(2));
		if (publicId) {
			setIsEditing(prev => (prev ? prev : false));
		}
	}, [
		pedidoData,
		form,
		isEditing,
		publicId,
		mapPedidoToFormData,
		safeNumber,
		computeConvertedTotal,
	]);

	const displayData = useMemo<PedidoCompraBasicFormData | null>(() => {
		if (savedData) return savedData;
		if (pedidoAtual) return mapPedidoToFormData(pedidoAtual);
		return null;
	}, [savedData, pedidoAtual, mapPedidoToFormData]);

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

	const createItemMutation = usePedidoCompraItemControllerCreate({
		mutation: {
			onSuccess: item => {
				const selectedItem = buildSelectedSkuFromItem(item);
				const nextItems = [...selectedSkus, selectedItem];
				setSelectedSkus(nextItems);
				setAdjustedPrices(prev => ({
					...prev,
					[selectedItem.product.id]: selectedItem.unitPrice,
				}));
				persistTotals(nextItems);
				invalidateItensQuery();
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.itemCreateError", {
						defaultValue: "Não foi possível adicionar o item ao pedido.",
					})
				);
			},
		},
	});

	const updateItemMutation = usePedidoCompraItemControllerUpdate({
		mutation: {
			onSuccess: item => {
				const updatedItem = buildSelectedSkuFromItem(item);
				const nextItems = selectedSkus.map(existing =>
					existing.itemId === item.id ? updatedItem : existing
				);
				setSelectedSkus(nextItems);
				setAdjustedPrices(prev => ({
					...prev,
					[updatedItem.product.id]: updatedItem.unitPrice,
				}));
				persistTotals(nextItems);
				invalidateItensQuery();
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.itemUpdateError", {
						defaultValue: "Não foi possível atualizar o item do pedido.",
					})
				);
			},
		},
	});

	const removeItemMutation = usePedidoCompraItemControllerRemove({
		mutation: {
			onSuccess: (_, variables) => {
				const removedId = Number(variables.id);
				const nextItems = selectedSkus.filter(
					item => item.itemId !== removedId
				);
				setSelectedSkus(nextItems);
				persistTotals(nextItems);
				invalidateItensQuery();
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.itemRemoveError", {
						defaultValue: "Não foi possível remover o item do pedido.",
					})
				);
			},
		},
	});

	const isMutatingItems =
		isLoadingItens ||
		createItemMutation.isPending ||
		updateItemMutation.isPending ||
		removeItemMutation.isPending ||
		updatePedidoTotalsMutation.isPending;

	useEffect(() => {
		if (!pedidoItensData) {
			if (!pedidoIdForItems) {
				setSelectedSkus([]);
				updateTotalsState([]);
			}
			return;
		}

		const mappedItems = pedidoItensData.map(buildSelectedSkuFromItem);
		setSelectedSkus(mappedItems);
		setAdjustedPrices(prev => {
			const next = { ...prev };
			mappedItems.forEach(item => {
				if (item.product.id) {
					next[item.product.id] = item.unitPrice;
				}
			});
			return next;
		});
		updateTotalsState(mappedItems);
	}, [
		pedidoItensData,
		buildSelectedSkuFromItem,
		pedidoIdForItems,
		updateTotalsState,
	]);

	const handlePriceChange = (newPrice: number) => {
		if (selectedProductId) {
			setAdjustedPrices(prev => ({
				...prev,
				[selectedProductId]: newPrice,
			}));
		}
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
					{/* Cards de dados básicos */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardContent className="pt-6">
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-semibold">Dados do Pedido</h3>
										<Button variant="outline" size="sm" onClick={handleEdit}>
											<Edit className="mr-2 h-4 w-4" />
											Editar
										</Button>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-2">
										<div>
											<span className="text-sm font-medium">
												{getSupplierName(displayData.fornecedorId)}
											</span>
											<p className="text-sm text-muted-foreground">
												{getLocationName(displayData.localEntradaId)}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												{t("purchaseOrders.form.labels.freightValue")}
											</Label>
											<p className="text-sm font-medium">
												{displayData?.valorFrete && displayData?.currencyId
													? formatCurrency(
															displayData?.valorFrete || "",
															displayData?.currencyId || ""
														)
													: "R$ 0,00"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												{t("purchaseOrders.form.labels.commissionValue")}
											</Label>
											<p className="text-sm font-medium">
												{displayData?.valorComissao && displayData?.currencyId
													? formatCurrency(
															displayData?.valorComissao || "",
															displayData?.currencyId || ""
														)
													: "R$ 0,00"}
											</p>
										</div>
									</div>

									{displayData.observacao && (
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												{t("purchaseOrders.form.labels.observation")}
											</Label>
											<p className="text-sm">{displayData.observacao}</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Card de Valores - Só aparece após criação */}
						<Card>
							<CardContent className="pt-6">
								<div className="space-y-6">
									{/* Valor Original e Valor Total lado a lado */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm font-medium text-muted-foreground">
												Valor Original
											</Label>
											<div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
												<span className="text-xl font-bold text-primary">
													{valorTotalOriginal && displayData?.currencyId
														? formatCurrency(
																valorTotalOriginal,
																displayData?.currencyId || ""
															)
														: "R$ 0,00"}
												</span>
											</div>
										</div>

										<div className="space-y-2">
											<Label className="text-sm font-medium text-muted-foreground">
												Valor Total
											</Label>
											<div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
												<span className="text-xl font-bold text-primary">
													{valorTotalConvertido
														? formatPartnerCurrency(valorTotalConvertido)
														: "R$ 0,00"}
												</span>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Cards de seleção de produtos - apenas no modo de visualização */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Card 1: Seleção de Produtos e SKUs */}
						<Card>
							<CardContent className="pt-6 space-y-4">
								{!localEntradaId ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-muted-foreground">
											{t("purchaseOrders.form.selectEntryLocation")}
										</div>
									</div>
								) : (
									<>
										{/* Seletor de Produtos */}
										<ProductSelector
											products={produtosData || []}
											selectedProductId={selectedProductId}
											onProductSelect={setSelectedProductId}
											isLoading={isLoadingProducts}
											error={errorProducts}
											disabled={!localEntradaId}
										/>

										{/* Lista de SKUs do produto selecionado */}
										{selectedProductId && (
											<div className="space-y-2">
												<Label className="text-sm font-medium">
													{t("purchaseOrders.form.labels.productSkus")}
												</Label>
												<p className="text-sm text-muted-foreground">
													{t("purchaseOrders.form.doubleClickToAdd")}
												</p>
												<SkuListing
													selectedProduct={selectedProduct}
													selectedProductId={selectedProductId}
													skus={selectedProductSkus}
													isLoading={isLoadingProducts}
													error={errorProducts}
													enableStockAdjustment={false}
													onDoubleClick={handleAddSkuToPurchase}
													allowZeroStock={true}
													showProductPrice={true}
													onPriceChange={handlePriceChange}
												/>
											</div>
										)}
									</>
								)}
							</CardContent>
						</Card>

						{/* Card 2: Produtos Selecionados para Compra */}
						<SelectedSkusList
							selectedSkus={selectedSkus}
							onRemoveSku={handleRemoveSku}
							onUpdateQuantity={handleUpdateQuantity}
							showStockLimit={false} // Para pedido de compra, não há limite de estoque
							scrollAreaHeight="h-[800px]"
						/>
					</div>
				</div>
			) : (
				// Modo de edição - Apenas formulário básico
				<Card>
					<CardContent className="pt-6">
						<Form {...form}>
							<form
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								onSubmit={form.handleSubmit(onSubmit as any)}
								className="space-y-6"
							>
								{/* Primeira linha - Fornecedor, Local de Entrada e Consignado */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<FormField
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										control={form.control as any}
										name="fornecedorId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("purchaseOrders.form.labels.supplier")} *
												</FormLabel>
												<Select
													onValueChange={value => {
														field.onChange(value);
													}}
													value={field.value}
													disabled={
														isLoadingFornecedores ||
														!parceiroIdNumber ||
														fornecedores.length === 0 ||
														isFornecedorLocked
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"purchaseOrders.form.placeholders.supplier"
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{isLoadingFornecedores ? (
															<SelectItem value="loading" disabled>
																{t("common.loading")}
															</SelectItem>
														) : fornecedores.length === 0 ? (
															<SelectItem value="empty" disabled>
																{t("purchaseOrders.form.noSuppliers", {
																	defaultValue: "Nenhum fornecedor disponível",
																})}
															</SelectItem>
														) : (
															fornecedores.map(supplier => (
																<SelectItem
																	key={supplier.id}
																	value={supplier.id.toString()}
																>
																	{supplier.nome}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										control={form.control as any}
										name="localEntradaId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("purchaseOrders.form.labels.entryLocation")} *
												</FormLabel>
												<Select
													onValueChange={value => {
														field.onChange(value);
														setLocalEntradaId(Number(value));
													}}
													value={field.value}
													disabled={isLoadingLocations || locais.length === 0}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"purchaseOrders.form.placeholders.entryLocation"
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{locais.length === 0 ? (
															<SelectItem value="empty" disabled>
																{t("purchaseOrders.form.noLocations", {
																	defaultValue: "Nenhum local disponível",
																})}
															</SelectItem>
														) : (
															locais.map((local: LocalEstoque) => (
																<SelectItem
																	key={local.id}
																	value={local.id.toString()}
																>
																	{local.nome}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										control={form.control as any}
										name="consignado"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">
														{t("purchaseOrders.form.labels.consigned")}
													</FormLabel>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>

								{/* Segunda linha - Moeda e Taxa de Câmbio */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										control={form.control as any}
										name="currencyId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("purchaseOrders.form.labels.currency")} *
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
													disabled={
														isLoadingCurrencies || currencies.length === 0
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"purchaseOrders.form.placeholders.currency"
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{isLoadingCurrencies ? (
															<SelectItem value="loading" disabled>
																{t("common.loading")}
															</SelectItem>
														) : currencies.length === 0 ? (
															<SelectItem value="empty" disabled>
																{t("purchaseOrders.form.noCurrencies", {
																	defaultValue: "Nenhuma moeda disponível",
																})}
															</SelectItem>
														) : (
															currencies.map(currency => (
																<SelectItem
																	key={currency.id}
																	value={currency.id.toString()}
																>
																	{currency.prefixo} {currency.nome} (
																	{currency.isoCode})
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										control={form.control as any}
										name="cotacao"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("purchaseOrders.form.labels.exchangeRate")}
												</FormLabel>
												<FormControl>
													<CurrencyInput
														id="cotacao"
														name="cotacao"
														placeholder={t(
															"purchaseOrders.form.placeholders.exchangeRate"
														)}
														value={field.value}
														decimalsLimit={2}
														onValueChange={value => {
															const nextValue = value || "";
															field.onChange(nextValue);
															refreshTotals({ cotacao: nextValue });
														}}
														className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Terceira linha - Valor do Frete e Valor da Comissão */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										control={form.control as any}
										name="valorFrete"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("purchaseOrders.form.labels.freightValue")}
												</FormLabel>
												<FormControl>
													<CurrencyInput
														id="valorFrete"
														name="valorFrete"
														placeholder={t(
															"purchaseOrders.form.placeholders.freightValue"
														)}
														value={field.value}
														decimalsLimit={2}
														onValueChange={value => {
															const nextValue = value || "";
															field.onChange(nextValue);
															refreshTotals({ valorFrete: nextValue });
														}}
														className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										control={form.control as any}
										name="valorComissao"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("purchaseOrders.form.labels.commissionValue")}
												</FormLabel>
												<FormControl>
													<CurrencyInput
														id="valorComissao"
														name="valorComissao"
														placeholder={t(
															"purchaseOrders.form.placeholders.commissionValue"
														)}
														value={field.value}
														decimalsLimit={2}
														onValueChange={value => {
															const nextValue = value || "";
															field.onChange(nextValue);
															refreshTotals({ valorComissao: nextValue });
														}}
														className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Campo de Observação */}
								<FormField
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									control={form.control as any}
									name="observacao"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("purchaseOrders.form.labels.observation")}
											</FormLabel>
											<FormControl>
												<Textarea
													{...field}
													placeholder={t(
														"purchaseOrders.form.placeholders.observation"
													)}
													rows={3}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Botões de Ação */}
								<div className="flex justify-end gap-4">
									<Button
										type="button"
										variant="outline"
										onClick={handleCancel}
										disabled={isSaving}
									>
										{t("purchaseOrders.form.actions.cancel")}
									</Button>
									<Button type="submit" disabled={isSaving}>
										{isSaving
											? t("purchaseOrders.form.actions.saving")
											: t("purchaseOrders.form.actions.save")}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			)}
		</DashboardLayout>
	);
};
