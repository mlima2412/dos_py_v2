import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeftRight, MapPin, Package } from "lucide-react";
import { SkuListing, type SkuListingRef } from "@/components/SkuListing";
import { type SelectedSkusListRef } from "@/components/SelectedSkusList";
import { ProductSelector, SelectedSkusList } from "@/components";
import { useLocaisEstoque } from "@/hooks/useEstoques";
import {
	useProdutoControllerFindByLocal,
	useTransferenciaEstoqueControllerCreate,
	estoqueSkuControllerFindOne,
} from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useToast } from "@/hooks/useToast";

import type { LocalEstoque } from "@/api-client/types";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
	CreateTransferenciaEstoqueDto,
} from "@/api-client/types";

// Interfaces para tipagem dos dados do backend
interface SkuData {
	publicId?: string;
	cor?: string;
	tamanho?: string;
	codCor?: number;
	qtdMinima?: number;
	produto?: {
		id?: number;
		publicId?: string;
		nome?: string;
		precoVenda?: number;
		precoCompra?: number;
		ativo?: boolean;
		consignado?: boolean;
	};
}

export const TransferenciaEstoque: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();
	const { success: showSuccess, error: showError } = useToast();

	// Refs para os componentes
	const skuListingRef = useRef<SkuListingRef>(null);
	const selectedSkusListRef = useRef<SelectedSkusListRef>(null);

	// Estados para seleção de locais
	const [localSaidaId, setLocalSaidaId] = useState<number | null>(null);
	const [localDestinoId, setLocalDestinoId] = useState<number | null>(null);

	// Estados para produtos e SKUs
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);
	const [skuSearchCode, setSkuSearchCode] = useState("");

	// Estado para SKUs selecionados para transferência
	const [selectedSkus, setSelectedSkus] = useState<
		Array<{
			sku: ProdutoSKUEstoqueResponseDto;
			product: ProdutosPorLocalResponseDto;
			quantity: number;
		}>
	>([]);

	// Hook para criar transferência de estoque
	const transferenciaMutation = useTransferenciaEstoqueControllerCreate({
		mutation: {
			onSuccess: data => {
				showSuccess(`Transferência criada com sucesso! ID: ${data.publicId}`);
				handleCancel(); // Limpar todos os campos após sucesso
			},
			onError: error => {
				const errorMessage =
					error?.data?.message ||
					"Erro ao criar transferência. Tente novamente.";
				showError(errorMessage);
			},
		},
	});

	// Buscar locais de estoque do parceiro selecionado
	const {
		data: locaisData,
		isLoading: isLoadingLocations,
		error: errorLocations,
	} = useLocaisEstoque({
		parceiroId: selectedPartnerId ? Number(selectedPartnerId) : undefined,
	});

	// Flatten dos dados de locais
	const locais = useMemo(() => {
		return (
			locaisData?.pages.flatMap(page => page.data || []).filter(Boolean) || []
		);
	}, [locaisData]);

	// Buscar produtos do local de saída selecionado
	const {
		data: produtosData,
		isLoading: isLoadingProducts,
		error: errorProducts,
	} = useProdutoControllerFindByLocal(
		locais.find(loc => loc.id === localSaidaId)?.publicId || "",
		{
			"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
		},
		{
			apenasComEstoque: true,
		},
		{
			query: {
				enabled: !!localSaidaId && !!selectedPartnerId,
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
	const selectedProduct =
		produtosData?.find(
			(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
		) || null;

	// Função para adicionar SKU à lista de transferência
	const handleAddSkuToTransfer = (sku: ProdutoSKUEstoqueResponseDto) => {
		if (!selectedProduct) return;

		const existingSkuIndex = selectedSkus.findIndex(
			item => item.sku.id === sku.id
		);

		if (existingSkuIndex >= 0) {
			// Se já existe, incrementar quantidade até o máximo disponível
			const currentQuantity = selectedSkus[existingSkuIndex].quantity;
			const maxQuantity = sku.estoque;
			const newQuantity = Math.min(currentQuantity + 1, maxQuantity);

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

	// Função para remover SKU da lista de transferência
	const handleRemoveSku = (skuId: number) => {
		setSelectedSkus(prev => prev.filter(item => item.sku.id !== skuId));
	};

	// Função para atualizar quantidade de um SKU
	const handleUpdateQuantity = (skuId: number, quantity: number) => {
		setSelectedSkus(prev =>
			prev.map(item => (item.sku.id === skuId ? { ...item, quantity } : item))
		);
	};

	// Função para buscar SKU por código diretamente no backend
	const handleSkuSearch = async (code: string) => {
		if (!localSaidaId || !code.trim()) {
			showError("Selecione o local de origem e digite um código válido");
			return;
		}

		try {
			// Extrair SKU ID dos últimos 3 dígitos do código
			const skuId = parseInt(code.slice(-3));

			if (isNaN(skuId)) {
				showError("Código inválido. Use o formato XXX-YYY");
				return;
			}

			// Buscar estoque no backend - verifica automaticamente se o SKU pertence ao local
			const estoqueSku = await estoqueSkuControllerFindOne(localSaidaId, skuId);

			// Verificar se há estoque disponível
			if (estoqueSku.qtd <= 0) {
				showError("SKU não possui estoque disponível no local de origem");
				return;
			}

			// Verificar se os dados do SKU estão disponíveis
			if (!estoqueSku.sku || typeof estoqueSku.sku !== "object") {
				showError("Dados do SKU não encontrados");
				return;
			}

			const skuData = estoqueSku.sku as SkuData;

			// Converter EstoqueSku para o formato esperado
			const skuForTransfer: ProdutoSKUEstoqueResponseDto = {
				id: estoqueSku.skuId,
				publicId: skuData.publicId || estoqueSku.skuId.toString(),
				cor: skuData.cor || "",
				tamanho: skuData.tamanho || "",
				codCor: skuData.codCor || 0,
				qtdMinima: skuData.qtdMinima || 0,
				estoque: estoqueSku.qtd,
			};

			// Criar objeto produto para compatibilidade
			const productForTransfer: ProdutosPorLocalResponseDto = {
				id: skuData.produto?.id || 0,
				publicId:
					skuData.produto?.publicId || skuData.produto?.id?.toString() || "0",
				nome: skuData.produto?.nome || "Produto não encontrado",
				precoVenda: skuData.produto?.precoVenda || 0,
				precoCompra: skuData.produto?.precoCompra || 0,
				ativo: skuData.produto?.ativo || true,
				consignado: skuData.produto?.consignado || false,
				ProdutoSKU: [skuForTransfer],
			};

			// Verificar quantidade já selecionada
			const existingItem = selectedSkus.find(
				item => item.sku.id === skuForTransfer.id
			);
			const currentQuantity = existingItem?.quantity || 0;
			const availableStock = skuForTransfer.estoque;

			// Validar se há estoque suficiente
			if (currentQuantity >= availableStock) {
				showError(
					`Estoque insuficiente. Disponível: ${availableStock}, Já selecionado: ${currentQuantity}`
				);
				setSkuSearchCode("");
				return;
			}

			// Adicionar à lista de transferência
			let wasAdded = false;
			setSelectedSkus(prev => {
				const existingIndex = prev.findIndex(
					item => item.sku.id === skuForTransfer.id
				);

				if (existingIndex >= 0) {
					// Se já existe, incrementar quantidade até o máximo disponível
					const currentQty = prev[existingIndex].quantity;
					const newQuantity = Math.min(currentQty + 1, availableStock);

					if (newQuantity > currentQty) {
						wasAdded = true;
					}

					return prev.map((item, index) =>
						index === existingIndex ? { ...item, quantity: newQuantity } : item
					);
				} else {
					// Se não existe, adicionar com quantidade 1
					wasAdded = true;
					return [
						...prev,
						{
							sku: skuForTransfer,
							product: productForTransfer,
							quantity: 1,
						},
					];
				}
			});

			// Selecionar automaticamente o produto
			if (skuData.produto?.id && skuData.produto.id !== selectedProductId) {
				setSelectedProductId(skuData.produto.id);
			}

			setSkuSearchCode("");

			if (wasAdded) {
				showSuccess(`SKU ${code} adicionado à transferência`);

				// Scroll para o item no SkuListing após pequeno delay
				setTimeout(() => {
					skuListingRef.current?.scrollToItem(skuForTransfer.id);
				}, 100);

				// Scroll para o item no SelectedSkusList após delay maior
				setTimeout(() => {
					selectedSkusListRef.current?.scrollToItem(skuForTransfer.id);
				}, 400);
			}
		} catch (error: unknown) {
			console.error("Erro ao buscar SKU:", error);
			const apiError = error as {
				status?: number;
				data?: { message?: string };
			};
			if (apiError?.status === 404) {
				showError("SKU não encontrado no local de origem selecionado");
			} else {
				showError(apiError?.data?.message || "Erro ao buscar SKU no estoque");
			}
			setSkuSearchCode("");
		}
	};

	// Função para limpar tudo (botão cancelar)
	const handleCancel = () => {
		setLocalSaidaId(null);
		setLocalDestinoId(null);
		setSelectedProductId(null);
		setSelectedSkus([]);
		setSkuSearchCode("");
	};

	// Função para executar a transferência
	const handleTransfer = async () => {
		if (!localSaidaId || !localDestinoId || selectedSkus.length === 0) {
			showError(
				"Por favor, selecione os locais e pelo menos um SKU para transferir."
			);
			return;
		}

		try {
			const transferenciaData: CreateTransferenciaEstoqueDto = {
				localOrigemId: localSaidaId,
				localDestinoId: localDestinoId,
				skus: selectedSkus.map(item => ({
					skuId: item.sku.id,
					qtd: item.quantity,
					tipo: "TRANSFERENCIA" as const,
					localOrigemId: localSaidaId,
					localDestinoId: localDestinoId,
					observacao: `Transferência automática - ${item.product.nome}`,
				})),
				observacao: `Transferência criada via interface - ${selectedSkus.length} item(s)`,
			};

			await transferenciaMutation.mutateAsync({
				data: transferenciaData,
				headers: {
					"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
				},
			});
		} catch (error) {
			// O erro já é tratado no onError do hook
			console.error("Erro na transferência:", error);
		}
	};

	// Verificar se pode selecionar produtos (origem e destino definidos)
	const canSelectProducts = localSaidaId && localDestinoId;

	// Verificar se pode alterar locais (nenhum SKU selecionado)
	const canChangeLocations = selectedSkus.length === 0;

	// Limpar seleções quando mudar o local de saída
	useEffect(() => {
		setSelectedProductId(null);
		setSelectedSkus([]);
		setSkuSearchCode("");
	}, [localSaidaId]);

	// Limpar apenas o código de busca quando mudar o produto
	useEffect(() => {
		setSkuSearchCode("");
	}, [selectedProductId]);

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
							<BreadcrumbPage>{t("inventory.transfer.title")}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Título */}
				<div className="flex items-center gap-2">
					<ArrowLeftRight className="h-6 w-6" />
					<h1 className="text-2xl font-bold">
						{t("inventory.transfer.title")}
					</h1>
				</div>

				{/* Layout de 4 cards */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Card 1: Seleção de Locais */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								{t("inventory.transfer.locations")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{errorLocations ? (
								<div className="flex items-center justify-center py-8">
									<div className="text-destructive">
										{t("inventory.transfer.errorLoadingLocations")}
									</div>
								</div>
							) : (
								<>
									{/* Local de Saída */}
									<div className="space-y-2">
										<label className="text-sm font-medium">
											{t("inventory.transfer.sourceLocation")}
										</label>
										<Select
											value={localSaidaId?.toString() || ""}
											onValueChange={value => setLocalSaidaId(Number(value))}
											disabled={isLoadingLocations || !canChangeLocations}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"inventory.transfer.selectSourceLocation"
													)}
												/>
											</SelectTrigger>
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
									</div>

									{/* Local de Destino */}
									<div className="space-y-2">
										<label className="text-sm font-medium">
											{t("inventory.transfer.destinationLocation")}
										</label>
										<Select
											value={localDestinoId?.toString() || ""}
											onValueChange={value => setLocalDestinoId(Number(value))}
											disabled={
												isLoadingLocations ||
												!localSaidaId ||
												!canChangeLocations
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"inventory.transfer.destinationLocation"
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{locais
													.filter(loc => loc.id !== localSaidaId)
													.map((local: LocalEstoque) => (
														<SelectItem
															key={local.id}
															value={local.id.toString()}
														>
															{local.nome}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Card 2: Seleção de Produtos */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								{t("inventory.transfer.products")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{!canSelectProducts ? (
								<div className="flex items-center justify-center py-8">
									<div className="text-muted-foreground">
										{!localSaidaId
											? t("inventory.transfer.selectSourceLocation")
											: !localDestinoId
												? t("inventory.transfer.destinationLocation")
												: t("inventory.transfer.selectSourceLocation")}
									</div>
								</div>
							) : (
								<div className="space-y-4">
									{/* Seletor de Produtos */}
									<ProductSelector
										products={produtosData || []}
										selectedProductId={selectedProductId}
										onProductSelect={setSelectedProductId}
										isLoading={isLoadingProducts}
										error={errorProducts}
										disabled={!canSelectProducts}
										placeholder={t("inventory.transfer.selectProduct")}
									/>

									{/* Campo de busca por código SKU */}
									<div className="space-y-2">
										<label className="text-sm font-medium">
											{t("inventory.transfer.skuCode")}
										</label>
										<Input
											placeholder={t("inventory.transfer.skuCodePlaceholder")}
											value={skuSearchCode}
											onChange={e => setSkuSearchCode(e.target.value)}
											onKeyPress={e => {
												if (e.key === "Enter") {
													handleSkuSearch(skuSearchCode);
												}
											}}
											disabled={!localSaidaId}
										/>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Card 3: SKUs do Produto Selecionado */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								{t("inventory.transfer.productSkus")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{!selectedProductId ? (
								<div className="flex items-center justify-center py-8">
									<div className="text-muted-foreground">
										{t("inventory.transfer.selectProduct")}
									</div>
								</div>
							) : (
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										{t("inventory.transfer.doubleClickToAdd")}
									</p>
									<SkuListing
										ref={skuListingRef}
										selectedProduct={selectedProduct}
										selectedProductId={selectedProductId}
										skus={selectedProductSkus}
										isLoading={isLoadingProducts}
										error={errorProducts}
										enableStockAdjustment={false}
										onDoubleClick={handleAddSkuToTransfer}
										allowZeroStock={false}
									/>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Card 4: SKUs Selecionados para Transferência */}
					<SelectedSkusList
						ref={selectedSkusListRef}
						selectedSkus={selectedSkus}
						onRemoveSku={handleRemoveSku}
						onUpdateQuantity={handleUpdateQuantity}
						title={t("inventory.transfer.selectedSkus")}
						emptyMessage={t("inventory.transfer.noSkusSelected")}
						showStockLimit={true}
						maxQuantity={sku => sku.estoque}
						scrollAreaHeight="h-[800px]"
					/>
				</div>

				{/* Botões de Ação */}
				<div className="flex justify-end gap-4">
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={transferenciaMutation.isPending}
					>
						{t("inventory.transfer.cancel")}
					</Button>
					<Button
						onClick={handleTransfer}
						disabled={
							selectedSkus.length === 0 ||
							!localDestinoId ||
							transferenciaMutation.isPending
						}
					>
						{transferenciaMutation.isPending ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
								{t("inventory.transfer.transferring")}
							</>
						) : (
							t("inventory.transfer.transfer")
						)}
					</Button>
				</div>
			</div>
		
	);
};
