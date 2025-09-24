import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
import { useProdutoControllerFindByLocal } from "@/api-client";
import {
	pedidoCompraBasicSchema,
	type PedidoCompraBasicFormData,
} from "./pedidoCompraSchema";
import { SkuListing } from "@/components/SkuListing";
import { ProductSelector, SelectedSkusList } from "@/components";

import type { LocalEstoque } from "@/api-client/types";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

// Dados mockados
const mockSuppliers = [
	{ id: "1", nome: "Fornecedor ABC Ltda" },
	{ id: "2", nome: "Distribuidora XYZ S.A." },
	{ id: "3", nome: "Comercial DEF Ltda" },
	{ id: "4", nome: "Importadora GHI Ltda" },
	{ id: "5", nome: "Atacadista JKL S.A." },
];

const mockLocations = [
	{ id: "1", nome: "Depósito Central", endereco: "Rua Principal, 123" },
	{ id: "2", nome: "Filial Norte", endereco: "Av. Norte, 456" },
	{ id: "3", nome: "Filial Sul", endereco: "Rua Sul, 789" },
	{
		id: "4",
		nome: "Centro de Distribuição",
		endereco: "Rodovia BR-101, Km 10",
	},
];

const mockCurrencies = [
	{
		id: "1",
		nome: "Real Brasileiro",
		prefixo: "R$",
		isoCode: "BRL",
		locale: "pt-BR",
	},
	{
		id: "2",
		nome: "Dólar Americano",
		prefixo: "$",
		isoCode: "USD",
		locale: "en-US",
	},
	{ id: "3", nome: "Euro", prefixo: "€", isoCode: "EUR", locale: "de-DE" },
	{
		id: "4",
		nome: "Peso Argentino",
		prefixo: "$",
		isoCode: "ARS",
		locale: "es-AR",
	},
];

export const FormularioPedidoCompra: React.FC = () => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartner();
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(true);
	const [savedData, setSavedData] = useState<PedidoCompraBasicFormData | null>(
		null
	);
	const [valorTotalOriginal, setValorTotalOriginal] =
		useState<string>("7.531,00");
	const [valorTotalConvertido, setValorTotalConvertido] =
		useState<string>("7.531,000");

	// Estados para seleção de local e produtos
	const [localEntradaId, setLocalEntradaId] = useState<number | null>(null);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);

	// Estado para SKUs selecionados para compra
	const [selectedSkus, setSelectedSkus] = useState<
		Array<{
			sku: ProdutoSKUEstoqueResponseDto;
			product: ProdutosPorLocalResponseDto;
			quantity: number;
		}>
	>([]);

	// Estado para controlar preços ajustados dos produtos
	const [adjustedPrices, setAdjustedPrices] = useState<Record<number, number>>(
		{}
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

	// Função para calcular valores totais e conversões
	const calculateTotals = React.useCallback(() => {
		const valorFrete = parseFloat(form.getValues("valorFrete") || "0");
		const valorComissao = parseFloat(form.getValues("valorComissao") || "0");
		const cotacao = parseFloat(form.getValues("cotacao") || "1");

		// Calcular valor dos produtos selecionados
		const valorProdutos = selectedSkus.reduce((total, item) => {
			// Usar o preço de compra do produto selecionado
			const valorUnitario = item.product.precoCompra || 0;
			return total + valorUnitario * item.quantity;
		}, 0);

		// Valor total na moeda original (frete + comissão + produtos)
		const totalOriginal = valorFrete + valorComissao + valorProdutos;
		setValorTotalOriginal(totalOriginal.toFixed(2));

		// Valor total convertido para a moeda do parceiro
		const totalConvertido = totalOriginal * cotacao;
		setValorTotalConvertido(totalConvertido.toFixed(2));
	}, [form, selectedSkus]);

	// Função para adicionar SKU à lista de compra
	const handleAddSkuToPurchase = (sku: ProdutoSKUEstoqueResponseDto) => {
		if (!selectedProduct) return;

		const existingSkuIndex = selectedSkus.findIndex(
			item => item.sku.id === sku.id
		);

		if (existingSkuIndex >= 0) {
			// Se já existe, incrementar quantidade
			const currentQuantity = selectedSkus[existingSkuIndex].quantity;
			const newQuantity = currentQuantity + 1;

			setSelectedSkus(prev =>
				prev.map((item, index) =>
					index === existingSkuIndex ? { ...item, quantity: newQuantity } : item
				)
			);
		} else {
			// Se não existe, adicionar com quantidade 1
			setSelectedSkus(prev => [
				...prev,
				{
					sku,
					product: selectedProduct,
					quantity: 1,
				},
			]);
		}
	};

	// Função para remover SKU da lista de compra
	const handleRemoveSku = (skuId: number) => {
		setSelectedSkus(prev => prev.filter(item => item.sku.id !== skuId));
	};

	// Função para atualizar quantidade de um SKU
	const handleUpdateQuantity = (skuId: number, quantity: number) => {
		setSelectedSkus(prev =>
			prev.map(item => (item.sku.id === skuId ? { ...item, quantity } : item))
		);
	};

	// Calcular valores totais quando os dados mudam
	const valorFrete = form.watch("valorFrete");
	const valorComissao = form.watch("valorComissao");
	const cotacao = form.watch("cotacao");

	useEffect(() => {
		calculateTotals();
	}, [valorFrete, valorComissao, cotacao, selectedSkus, calculateTotals]);

	// Limpar seleções quando mudar o local de entrada
	useEffect(() => {
		setSelectedProductId(null);
		setSelectedSkus([]);
	}, [localEntradaId]);

	// Limpar seleção de produto quando mudar
	useEffect(() => {
		setSelectedProductId(null);
	}, [localEntradaId]);

	const onSubmit = async (data: PedidoCompraBasicFormData) => {
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

		setIsLoading(true);

		try {
			// Simular criação do pedido
			await new Promise(resolve => setTimeout(resolve, 1000));

			// TODO: Aqui será feita a chamada real para a API
			console.log("Dados do pedido:", {
				...data,
				parceiroId: selectedPartnerId,
				localEntradaId: formLocalEntradaId,
			});

			// Salvar dados e mudar para modo de visualização
			setSavedData(data);
			setIsEditing(false);
			toast.success(t("purchaseOrders.form.messages.createSuccess"));

			// Após salvar, o usuário pode selecionar produtos no modo de visualização
		} catch (error) {
			console.error("Erro ao criar pedido:", error);
			toast.error(t("purchaseOrders.form.messages.createError"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		navigate("/pedidoCompra");
	};

	const handleEdit = () => {
		setIsEditing(true);
		// Resetar o formulário com os dados salvos
		if (savedData) {
			form.reset(savedData);
			setLocalEntradaId(Number(savedData.localEntradaId));
		}
	};

	// Funções auxiliares para obter dados dos selects
	const getSupplierName = (id: string) => {
		return mockSuppliers.find(s => s.id === id)?.nome || "";
	};

	const getLocationName = (id: string) => {
		return mockLocations.find(l => l.id === id)?.nome || "";
	};

	// Função para formatar valores monetários
	const formatCurrency = (value: string, currencyId: string) => {
		const currency = mockCurrencies.find(c => c.id === currencyId);
		if (!currency) return value;

		const numericValue = parseFloat(value || "0");
		return new Intl.NumberFormat(currency.locale, {
			style: "currency",
			currency: currency.isoCode,
		}).format(numericValue);
	};

	// Função para formatar valores na moeda do parceiro
	const formatPartnerCurrency = (value: string) => {
		if (!selectedPartnerLocale || !selectedPartnerIsoCode) return value;

		const numericValue = parseFloat(value || "0");
		return new Intl.NumberFormat(selectedPartnerLocale, {
			style: "currency",
			currency: selectedPartnerIsoCode,
		}).format(numericValue);
	};

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
			{!isEditing && savedData ? (
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
												{getSupplierName(savedData.fornecedorId)}
											</span>
											<p className="text-sm text-muted-foreground">
												{getLocationName(savedData.localEntradaId)}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												{t("purchaseOrders.form.labels.freightValue")}
											</Label>
											<p className="text-sm font-medium">
												{savedData?.valorFrete && savedData?.currencyId
													? formatCurrency(
															savedData?.valorFrete || "",
															savedData?.currencyId || ""
														)
													: "R$ 0,00"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												{t("purchaseOrders.form.labels.commissionValue")}
											</Label>
											<p className="text-sm font-medium">
												{savedData?.valorComissao && savedData?.currencyId
													? formatCurrency(
															savedData?.valorComissao || "",
															savedData?.currencyId || ""
														)
													: "R$ 0,00"}
											</p>
										</div>
									</div>

									{savedData.observacao && (
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												{t("purchaseOrders.form.labels.observation")}
											</Label>
											<p className="text-sm">{savedData.observacao}</p>
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
												<span className="text-2xl font-bold text-primary">
													{valorTotalOriginal && savedData?.currencyId
														? formatCurrency(
																valorTotalOriginal,
																savedData?.currencyId || ""
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
												<span className="text-2xl font-bold text-primary">
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
													onValueChange={field.onChange}
													defaultValue={field.value}
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
														{mockSuppliers.map(supplier => (
															<SelectItem key={supplier.id} value={supplier.id}>
																{supplier.nome}
															</SelectItem>
														))}
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
													defaultValue={field.value}
													disabled={isLoadingLocations}
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
														{locais.map((local: LocalEstoque) => (
															<SelectItem
																key={local.id}
																value={local.id.toString()}
															>
																{local.nome}
															</SelectItem>
														))}
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
													defaultValue={field.value}
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
														{mockCurrencies.map(currency => (
															<SelectItem key={currency.id} value={currency.id}>
																{currency.prefixo} {currency.nome} (
																{currency.isoCode})
															</SelectItem>
														))}
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
															field.onChange(value || "");
															calculateTotals();
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
															field.onChange(value || "");
															calculateTotals();
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
															field.onChange(value || "");
															calculateTotals();
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
										disabled={isLoading}
									>
										{t("purchaseOrders.form.actions.cancel")}
									</Button>
									<Button type="submit" disabled={isLoading}>
										{isLoading
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
