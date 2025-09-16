import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search, Package, MapPin, ShoppingCart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { useLocaisEstoque } from "@/hooks/useEstoques";
import { useProdutoControllerFindByLocal } from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategoriasProduto } from "@/hooks/useCategoriaProduto";

import type { LocalEstoque } from "@/api-client/types";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

export const VisualizarEstoque: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();

	const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
		null
	);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);
	const [productSearch, setProductSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");

	const debouncedProductSearch = useDebounce(productSearch, 500);

	// Buscar locais de estoque do parceiro selecionado
	const {
		data: locaisData,
		isLoading: isLoadingLocations,
		error: errorLocations,
	} = useLocaisEstoque({
		parceiroId: selectedPartnerId ? Number(selectedPartnerId) : undefined,
	});

	// Buscar categorias de produtos
	const { data: categorias } = useCategoriasProduto();

	// Flatten dos dados de locais
	const locais = useMemo(() => {
		return (
			locaisData?.pages.flatMap(page => page.data || []).filter(Boolean) || []
		);
	}, [locaisData]);

	// Encontrar o local selecionado
	const selectedLocation = locais.find(
		(local: LocalEstoque) => local.id === selectedLocationId
	);

	// Buscar produtos do local selecionado
	const {
		data: produtosData,
		isLoading: isLoadingProducts,
		error: errorProducts,
	} = useProdutoControllerFindByLocal(
		selectedLocation?.publicId || "",
		{
			"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
		},
		{
			apenasComEstoque: true, // Apenas produtos com estoque
		},
		{
			query: {
				enabled: !!selectedLocation?.publicId && !!selectedPartnerId,
			},
		}
	);

	// SKUs agora vêm junto com os produtos do novo endpoint

	// Filtrar produtos por busca e categoria (agora no frontend já que o endpoint não suporta busca)
	const filteredProducts = useMemo(() => {
		if (!produtosData) return [];

		let filtered = produtosData;

		// Filtrar por busca
		if (debouncedProductSearch) {
			filtered = filtered.filter((produto: ProdutosPorLocalResponseDto) =>
				produto.nome
					.toLowerCase()
					.includes(debouncedProductSearch.toLowerCase())
			);
		}

		// Filtrar por categoria
		if (categoryFilter !== "all") {
			filtered = filtered.filter(
				(produto: ProdutosPorLocalResponseDto) =>
					produto.categoria?.id?.toString() === categoryFilter
			);
		}

		return filtered;
	}, [produtosData, debouncedProductSearch, categoryFilter]);

	// Filtrar SKUs por produto selecionado
	const filteredSkus = useMemo(() => {
		if (!selectedProductId || !produtosData) return [];

		// Encontrar o produto selecionado
		const selectedProduct = produtosData.find(
			(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
		);

		// Retornar os SKUs do produto selecionado
		return selectedProduct?.ProdutoSKU || [];
	}, [selectedProductId, produtosData]);

	// Auto-selecionar local se houver apenas um
	useEffect(() => {
		if (locais.length === 1 && !selectedLocationId) {
			setSelectedLocationId(locais[0].id);
		}
	}, [locais, selectedLocationId]);

	// Limpar seleção de produto quando mudar o local
	useEffect(() => {
		setSelectedProductId(null);
	}, [selectedLocationId]);

	// Limpar seleção de produto se ele não estiver mais na lista filtrada
	useEffect(() => {
		if (selectedProductId) {
			const productExists = filteredProducts.some(
				(produto: ProdutosPorLocalResponseDto) =>
					produto.id === selectedProductId
			);
			if (!productExists) {
				setSelectedProductId(null);
			}
		}
	}, [filteredProducts, selectedProductId]);

	const selectedProduct = filteredProducts.find(
		(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
	);

	// Estados de loading e error para SKUs (agora baseados nos produtos)
	const isLoadingSkus = isLoadingProducts;
	const errorSkus = errorProducts;

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
							<BreadcrumbPage>{t("inventory.view.products")}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Seleção de Local de Estoque */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MapPin className="h-5 w-5" />
							{t("inventory.view.location")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoadingLocations ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-muted-foreground">
									{t("inventory.view.loadingLocations")}
								</div>
							</div>
						) : errorLocations ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-destructive">
									{t("inventory.view.errorLoadingLocations")}
								</div>
							</div>
						) : locais.length === 0 ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-muted-foreground">
									{t("inventory.view.noLocations")}
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{locais.map((local: LocalEstoque) => (
									<Card
										key={local.id}
										className={`cursor-pointer transition-colors hover:bg-muted/50 ${
											selectedLocationId === local.id ? "border-2" : "border"
										}`}
										style={{
											borderColor:
												selectedLocationId === local.id ? "#FB5A4F" : undefined,
										}}
										onClick={() => setSelectedLocationId(local.id)}
									>
										<CardContent className="p-4">
											<div className="flex items-start gap-3">
												<div className="p-2 bg-primary/10 rounded-lg">
													<Package className="h-5 w-5 text-primary" />
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold truncate">
														{local.nome}
													</h3>
													<p className="text-sm text-muted-foreground line-clamp-2">
														{local.descricao}
													</p>
													<p className="text-xs text-muted-foreground mt-1">
														{local.endereco}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Produtos e SKUs - Layout lado a lado */}
				{selectedLocationId && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Card de Produtos */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingCart className="h-5 w-5" />
									{t("inventory.view.products")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{/* Filtros */}
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 mb-4">
									<div className="relative flex-1">
										<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder={t("inventory.view.searchProducts")}
											value={productSearch}
											onChange={e => setProductSearch(e.target.value)}
											className="pl-8"
										/>
									</div>
									<Select
										value={categoryFilter}
										onValueChange={setCategoryFilter}
									>
										<SelectTrigger className="w-full md:w-[200px]">
											<SelectValue
												placeholder={t("inventory.view.filterByCategory")}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{t("inventory.view.allCategories")}
											</SelectItem>
											{categorias?.map(categoria => (
												<SelectItem
													key={categoria.id}
													value={categoria.id?.toString() || ""}
												>
													{categoria.descricao}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Lista de Produtos */}
								{isLoadingProducts ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-muted-foreground">
											{t("inventory.view.loadingProducts")}
										</div>
									</div>
								) : errorProducts ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-destructive">
											{t("inventory.view.errorLoadingProducts")}
										</div>
									</div>
								) : filteredProducts.length === 0 ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-muted-foreground">
											{t("inventory.view.noProducts")}
										</div>
									</div>
								) : (
									<ScrollArea className="h-[450px] w-full rounded-md border">
										<div className="min-w-[300px]">
											<Table>
												<TableHeader className="sticky top-0 bg-background z-10">
													<TableRow>
														<TableHead className="h-8 py-2 bg-background">
															{t("inventory.view.productName")}
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filteredProducts.map(
														(produto: ProdutosPorLocalResponseDto) => (
															<TableRow
																key={produto.id}
																className={`cursor-pointer hover:bg-muted/50 ${
																	selectedProductId === produto.id
																		? "bg-muted"
																		: ""
																}`}
																onClick={() => setSelectedProductId(produto.id)}
															>
																<TableCell className="font-medium">
																	{produto.nome}
																</TableCell>
															</TableRow>
														)
													)}
												</TableBody>
											</Table>
										</div>
									</ScrollArea>
								)}
							</CardContent>
						</Card>

						{/* Card de SKUs */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5" />
									{t("inventory.view.skus")}
									{selectedProduct && ` - ${selectedProduct.nome}`}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{!selectedProductId ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-center">
											<ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
											<p className="text-muted-foreground">
												{t("inventory.view.selectProduct")}
											</p>
										</div>
									</div>
								) : isLoadingSkus ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-muted-foreground">
											{t("inventory.view.loadingSkus")}
										</div>
									</div>
								) : errorSkus ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-destructive">
											{t("inventory.view.errorLoadingSkus")}
										</div>
									</div>
								) : filteredSkus.length === 0 ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-muted-foreground">
											{t("inventory.view.noSkus")}
										</div>
									</div>
								) : (
									<ScrollArea className="h-[500px] w-full rounded-md border">
										<div className="min-w-[400px]">
											<Table>
												<TableHeader className="sticky top-0 bg-background z-10">
													<TableRow>
														<TableHead className="h-8 py-2 bg-background text-center">
															{t("inventory.view.skuCode")}
														</TableHead>
														<TableHead className="h-8 py-2 bg-background text-left">
															{t("inventory.view.color")}
														</TableHead>
														<TableHead className="h-8 py-2 bg-background text-center">
															{t("inventory.view.size")}
														</TableHead>
														<TableHead className="h-8 py-2 bg-background text-center">
															{t("inventory.view.quantity")}
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filteredSkus.map(
														(sku: ProdutoSKUEstoqueResponseDto) => (
															<TableRow key={`${sku.id}-${sku.publicId}`}>
																<TableCell className="font-mono text-sm text-center">
																	{selectedProduct?.id
																		.toString()
																		.padStart(3, "0")}
																	-{sku.id.toString().padStart(3, "0")}
																</TableCell>
																<TableCell className="text-left">
																	{sku.cor ? (
																		<div className="flex items-center gap-2">
																			{sku.codCor && (
																				<div
																					className="w-4 h-4 rounded-full border"
																					style={{
																						backgroundColor: `#${sku.codCor.toString(16).padStart(6, "0")}`,
																					}}
																				/>
																			)}
																			{sku.cor}
																		</div>
																	) : (
																		"-"
																	)}
																</TableCell>
																<TableCell className="text-center">
																	{sku.tamanho || "-"}
																</TableCell>
																<TableCell className="text-center">
																	<Badge
																		variant={
																			sku.estoque <= sku.qtdMinima
																				? "destructive"
																				: sku.estoque <= sku.qtdMinima * 2
																					? "secondary"
																					: "default"
																		}
																	>
																		{sku.estoque}
																	</Badge>
																</TableCell>
															</TableRow>
														)
													)}
												</TableBody>
											</Table>
										</div>
									</ScrollArea>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
};
