import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
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
import {
	ArrowLeftRight,
	MapPin,
	Package,
	ShoppingCart,
	X,
	CheckIcon,
	ChevronDownIcon,
	Plus,
	Minus,
} from "lucide-react";
import { SkuListing } from "../components/SkuListing";
import { useLocaisEstoque } from "@/hooks/useEstoques";
import { useProdutoControllerFindByLocal } from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { cn } from "@/lib/utils";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { LocalEstoque } from "@/api-client/types";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

// Componente para seleção de produtos com busca (baseado no comp-229)
const ProductSelector: React.FC<{
	products: ProdutosPorLocalResponseDto[];
	selectedProductId: number | null;
	onProductSelect: (productId: number) => void;
	isLoading: boolean;
	error: any;
	disabled?: boolean;
}> = ({
	products,
	selectedProductId,
	onProductSelect,
	isLoading,
	error,
	disabled = false,
}) => {
	const { t } = useTranslation("common");
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	const selectedProduct = products.find(p => p.id === selectedProductId);

	// Filtrar produtos por busca
	const filteredProducts = useMemo(() => {
		if (!searchValue) return products;
		return products.filter(product =>
			product.nome.toLowerCase().includes(searchValue.toLowerCase())
		);
	}, [products, searchValue]);

	const handleSelect = (productId: number) => {
		if (disabled) return;
		onProductSelect(productId);
		setOpen(false);
		setSearchValue("");
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">
					{t("inventory.view.loadingProducts")}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-destructive">
					{t("inventory.view.errorLoadingProducts")}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium">
				{t("inventory.transfer.products")}
			</label>
			<Popover open={open && !disabled} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={disabled}
					>
						<span
							className={cn(
								"truncate",
								!selectedProduct && "text-muted-foreground"
							)}
						>
							{selectedProduct
								? selectedProduct.nome
								: t("inventory.transfer.selectProduct")}
						</span>
						<ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command>
						<CommandInput
							placeholder={t("inventory.view.searchProducts")}
							value={searchValue}
							onValueChange={setSearchValue}
						/>
						<CommandList>
							<CommandEmpty>{t("inventory.view.noProducts")}</CommandEmpty>
							<CommandGroup>
								{filteredProducts.map(product => (
									<CommandItem
										key={product.id}
										value={product.nome}
										onSelect={() => handleSelect(product.id)}
									>
										{product.nome}
										{selectedProductId === product.id && (
											<CheckIcon className="ml-auto h-4 w-4" />
										)}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};

// Componente para lista de SKUs selecionados
const SelectedSkusList: React.FC<{
	selectedSkus: Array<{
		sku: ProdutoSKUEstoqueResponseDto;
		product: ProdutosPorLocalResponseDto;
		quantity: number;
	}>;
	onRemoveSku: (skuId: number) => void;
	onUpdateQuantity: (skuId: number, quantity: number) => void;
}> = ({ selectedSkus, onRemoveSku, onUpdateQuantity }) => {
	const { t } = useTranslation("common");

	const handleIncrement = (
		skuId: number,
		currentQuantity: number,
		maxQuantity: number
	) => {
		const newQuantity = Math.min(currentQuantity + 1, maxQuantity);
		onUpdateQuantity(skuId, newQuantity);
	};

	const handleDecrement = (skuId: number, currentQuantity: number) => {
		const newQuantity = Math.max(currentQuantity - 1, 1);
		onUpdateQuantity(skuId, newQuantity);
	};

	const totalItems = selectedSkus.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ShoppingCart className="h-5 w-5" />
						{t("inventory.transfer.selectedSkus")}
					</div>
					{selectedSkus.length > 0 && (
						<span className="text-sm font-normal text-muted-foreground">
							{totalItems} {totalItems === 1 ? "item" : "itens"}
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{selectedSkus.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">
								{t("inventory.transfer.noSkusSelected")}
							</p>
						</div>
					</div>
				) : (
					<ScrollArea className="h-[450px] w-full rounded-md">
						<div className="space-y-2 pr-2">
							{selectedSkus.map(({ sku, product, quantity }) => (
								<div
									key={sku.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-mono text-sm">
												{product.id.toString().padStart(3, "0")}-
												{sku.id.toString().padStart(3, "0")}
											</span>
											{sku.cor && (
												<div className="flex items-center gap-1">
													{sku.codCor && (
														<div
															className="w-3 h-3 rounded-full border"
															style={{
																backgroundColor: `#${sku.codCor
																	.toString(16)
																	.padStart(6, "0")}`,
															}}
														/>
													)}
													<span className="text-xs text-muted-foreground">
														{sku.cor}
													</span>
												</div>
											)}
											{sku.tamanho && (
												<span className="text-xs text-muted-foreground">
													{sku.tamanho}
												</span>
											)}
										</div>
										<p className="text-sm font-medium truncate">
											{product.nome}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDecrement(sku.id, quantity)}
												disabled={quantity <= 1}
												className="h-8 w-8 p-0"
											>
												<Minus className="h-4 w-4" />
											</Button>
											<span className="w-12 text-center font-medium">
												{quantity}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleIncrement(sku.id, quantity, sku.estoque)
												}
												disabled={quantity >= sku.estoque}
												className="h-8 w-8 p-0"
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onRemoveSku(sku.id)}
											className="h-8 w-8 p-0"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
};

export const TransferenciaEstoque: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();

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

	// Função para buscar SKU por código
	const handleSkuSearch = (code: string) => {
		if (!selectedProductSkus || !selectedProduct) return;

		const sku = selectedProductSkus.find(sku => {
			const skuCode = `${selectedProduct.id
				.toString()
				.padStart(3, "0")}-${sku.id.toString().padStart(3, "0")}`;
			return skuCode.includes(code);
		});

		if (sku) {
			handleAddSkuToTransfer(sku);
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
		<DashboardLayout>
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
											placeholder={t("inventory.transfer.selectSourceLocation")}
										/>
									</SelectTrigger>
									<SelectContent>
										{locais.map((local: LocalEstoque) => (
											<SelectItem key={local.id} value={local.id.toString()}>
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
										isLoadingLocations || !localSaidaId || !canChangeLocations
									}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t("inventory.transfer.destinationLocation")}
										/>
									</SelectTrigger>
									<SelectContent>
										{locais
											.filter(loc => loc.id !== localSaidaId)
											.map((local: LocalEstoque) => (
												<SelectItem key={local.id} value={local.id.toString()}>
													{local.nome}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
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
											disabled={!selectedProductId}
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
										selectedProduct={selectedProduct}
										selectedProductId={selectedProductId}
										skus={selectedProductSkus}
										isLoading={isLoadingProducts}
										error={errorProducts}
										enableStockAdjustment={false}
										onDoubleClick={handleAddSkuToTransfer}
									/>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Card 4: SKUs Selecionados para Transferência */}
					<SelectedSkusList
						selectedSkus={selectedSkus}
						onRemoveSku={handleRemoveSku}
						onUpdateQuantity={handleUpdateQuantity}
					/>
				</div>

				{/* Botões de Ação */}
				<div className="flex justify-end gap-4">
					<Button variant="outline" onClick={handleCancel}>
						{t("inventory.transfer.cancel")}
					</Button>
					<Button disabled={selectedSkus.length === 0 || !localDestinoId}>
						{t("inventory.transfer.transfer")}
					</Button>
				</div>
			</div>
		</DashboardLayout>
	);
};
