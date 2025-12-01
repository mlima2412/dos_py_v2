import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Package, MapPin, Search, Loader2 } from "lucide-react";
import { AdjustStockDialog } from "./components/AdjustStockDialog";

import { useLocaisEstoque } from "@/hooks/useEstoques";
import { useProdutoControllerFindByLocal } from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useConferenciaEstoqueControllerCheckLocalEmConferencia } from "@/api-client/hooks/useConferenciaEstoqueControllerCheckLocalEmConferencia";
import { useToast } from "@/hooks/useToast";
import { useDebounce } from "@/hooks/useDebounce";

import type { LocalEstoque } from "@/api-client/types";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

const ITEMS_PER_PAGE = 20;

interface FlattenedSku {
	skuId: number;
	skuPublicId: string;
	produtoId: number;
	produtoNome: string;
	cor: string;
	tamanho: string;
	codCor?: string;
	qtdMinima: number;
	estoque: number;
}

export const VisualizarEstoque: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();
	const { error: toastError } = useToast();

	const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
		null
	);
	const [selectedProductId, setSelectedProductId] = useState<string>("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [sizeFilter, setSizeFilter] = useState<string>("all");
	const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

	const debouncedSearchTerm = useDebounce(searchTerm, 300);

	// Estado para o dialog de ajuste de estoque
	const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
	const [selectedSkuForAdjust, setSelectedSkuForAdjust] = useState<{
		skuId: number;
		currentStock: number;
		localId: number;
		skuInfo: {
			productName: string;
			color?: string;
			size?: string;
		};
	} | null>(null);

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

	// Encontrar o local selecionado
	const selectedLocation = locais.find(
		(local: LocalEstoque) => local.id === selectedLocationId
	);

	// Verificar se o local está em conferência
	const { data: localEmConferencia } =
		useConferenciaEstoqueControllerCheckLocalEmConferencia(
			selectedLocation?.publicId || "",
			{
				"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
			},
			{
				query: {
					enabled: !!selectedLocation?.publicId && !!selectedPartnerId,
				},
			}
		);

	// Buscar produtos do local selecionado (incluindo SKUs sem estoque)
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
			apenasComEstoque: false, // Trazer todos os SKUs, com ou sem estoque
		},
		{
			query: {
				enabled: !!selectedLocation?.publicId && !!selectedPartnerId,
			},
		}
	);

	// Flatten todos os SKUs de todos os produtos
	const allSkus = useMemo((): FlattenedSku[] => {
		if (!produtosData) return [];

		const flattened: FlattenedSku[] = [];

		produtosData.forEach((produto: ProdutosPorLocalResponseDto) => {
			produto.ProdutoSKU.forEach((sku: ProdutoSKUEstoqueResponseDto) => {
				flattened.push({
					skuId: sku.id,
					skuPublicId: sku.publicId,
					produtoId: produto.id,
					produtoNome: produto.nome,
					cor: sku.cor,
					tamanho: sku.tamanho,
					codCor: sku.codCor,
					qtdMinima: sku.qtdMinima,
					estoque: sku.estoque,
				});
			});
		});

		return flattened;
	}, [produtosData]);

	// Filtrar SKUs por produto, busca e tamanho
	const filteredSkus = useMemo(() => {
		let filtered = allSkus;

		// Filtrar por produto selecionado
		if (selectedProductId !== "all") {
			const productId = parseInt(selectedProductId, 10);
			filtered = filtered.filter(sku => sku.produtoId === productId);
		}

		// Filtrar por termo de busca (código SKU, nome do produto ou cor)
		if (debouncedSearchTerm) {
			const term = debouncedSearchTerm.toLowerCase();
			filtered = filtered.filter(sku => {
				const skuCode =
					`${sku.produtoId.toString().padStart(3, "0")}-${sku.skuId.toString().padStart(3, "0")}`.toLowerCase();
				const productName = sku.produtoNome.toLowerCase();
				const color = sku.cor?.toLowerCase() || "";

				return (
					skuCode.includes(term) ||
					productName.includes(term) ||
					color.includes(term)
				);
			});
		}

		// Filtrar por tamanho
		if (sizeFilter !== "all") {
			filtered = filtered.filter(sku => sku.tamanho === sizeFilter);
		}

		return filtered;
	}, [allSkus, selectedProductId, debouncedSearchTerm, sizeFilter]);

	// SKUs visíveis (paginados)
	const visibleSkus = useMemo(() => {
		return filteredSkus.slice(0, visibleCount);
	}, [filteredSkus, visibleCount]);

	// Verificar se há mais itens para carregar
	const hasMore = visibleCount < filteredSkus.length;

	// Obter tamanhos únicos dos SKUs
	const availableSizes = useMemo(() => {
		return allSkus
			.map(sku => sku.tamanho)
			.filter((size, index, self) => size && self.indexOf(size) === index)
			.sort();
	}, [allSkus]);

	// Auto-selecionar local se houver apenas um
	useEffect(() => {
		if (locais.length === 1 && !selectedLocationId) {
			setSelectedLocationId(locais[0].id);
		}
	}, [locais, selectedLocationId]);

	// Resetar paginação e filtros quando mudar o local
	useEffect(() => {
		setSelectedProductId("all");
		setSearchTerm("");
		setSizeFilter("all");
		setVisibleCount(ITEMS_PER_PAGE);
	}, [selectedLocationId]);

	// Resetar paginação quando mudar filtros
	useEffect(() => {
		setVisibleCount(ITEMS_PER_PAGE);
	}, [selectedProductId, debouncedSearchTerm, sizeFilter]);

	// Função para carregar mais itens
	const loadMore = () => {
		setVisibleCount(prev => prev + ITEMS_PER_PAGE);
	};

	// Função para abrir o dialog de ajuste de estoque
	const handleAdjustStock = (sku: FlattenedSku) => {
		if (!selectedLocationId) return;

		// Verificar se o local está em conferência
		if (localEmConferencia?.emConferencia) {
			toastError(t("inventory.adjust.conference.message"));
			return;
		}

		setSelectedSkuForAdjust({
			skuId: sku.skuId,
			currentStock: sku.estoque,
			localId: selectedLocationId,
			skuInfo: {
				productName: sku.produtoNome,
				color: sku.cor || undefined,
				size: sku.tamanho || undefined,
			},
		});
		setAdjustDialogOpen(true);
	};

	// Função para fechar o dialog de ajuste
	const handleCloseAdjustDialog = () => {
		setAdjustDialogOpen(false);
		setSelectedSkuForAdjust(null);
	};

	// Função chamada quando o ajuste é bem-sucedido
	const handleAdjustSuccess = () => {
		// Aqui você pode invalidar queries ou recarregar dados se necessário
	};

	return (
		<>
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

				{/* Card de SKUs do Estoque */}
				{selectedLocationId && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								{t("inventory.view.products")}
								{filteredSkus.length > 0 && (
									<Badge variant="secondary" className="ml-2">
										{filteredSkus.length} SKUs
									</Badge>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{/* Filtros */}
							<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 mb-4">
								{/* Busca */}
								<div className="relative flex-1">
									<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder={t("inventory.view.searchSkus")}
										value={searchTerm}
										onChange={e => setSearchTerm(e.target.value)}
										className="pl-8"
									/>
								</div>

								{/* Filtro por Produto */}
								<Combobox
									options={[
										{ value: "all", label: t("inventory.view.allProducts") },
										...(produtosData?.map(
											(produto: ProdutosPorLocalResponseDto) => ({
												value: produto.id.toString(),
												label: produto.nome,
											})
										) || []),
									]}
									value={selectedProductId}
									onValueChange={value =>
										setSelectedProductId(value || "all")
									}
									placeholder={t("inventory.view.filterByProduct")}
									searchPlaceholder={t("inventory.view.searchProducts")}
									emptyText={t("inventory.view.noProducts")}
									className="w-full md:w-[250px]"
								/>

								{/* Filtro por Tamanho */}
								<Select value={sizeFilter} onValueChange={setSizeFilter}>
									<SelectTrigger className="w-full md:w-[150px]">
										<SelectValue placeholder={t("inventory.view.filterBySize")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t("inventory.view.allSizes")}
										</SelectItem>
										{availableSizes.map(size => (
											<SelectItem key={size} value={size!}>
												{size}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Tabela de SKUs */}
							{isLoadingProducts ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									<span className="ml-2 text-muted-foreground">
										{t("inventory.view.loadingSkus")}
									</span>
								</div>
							) : errorProducts ? (
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
								<>
									<div className="rounded-md border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-center w-[120px]">
														{t("inventory.view.skuCode")}
													</TableHead>
													<TableHead className="text-left">
														{t("inventory.view.productName")}
													</TableHead>
													<TableHead className="text-left">
														{t("inventory.view.color")}
													</TableHead>
													<TableHead className="text-center w-[100px]">
														{t("inventory.view.size")}
													</TableHead>
													<TableHead className="text-center w-[100px]">
														{t("inventory.view.quantity")}
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{visibleSkus.map(sku => (
													<TableRow key={`${sku.produtoId}-${sku.skuId}`}>
														<TableCell className="font-mono text-sm text-center">
															{sku.produtoId.toString().padStart(3, "0")}-
															{sku.skuId.toString().padStart(3, "0")}
														</TableCell>
														<TableCell className="text-left font-medium">
															{sku.produtoNome}
														</TableCell>
														<TableCell className="text-left">
															{sku.cor ? (
																<div className="flex items-center gap-2">
																	{sku.codCor && (
																		<div
																			className="w-4 h-4 rounded-full border"
																			style={{
																				backgroundColor: `#${sku.codCor}`,
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
															<Tooltip>
																<TooltipTrigger asChild>
																	<Badge
																		variant={
																			sku.estoque <= 0
																				? "destructive"
																				: sku.estoque <= sku.qtdMinima
																					? "destructive"
																					: sku.estoque <= sku.qtdMinima * 2
																						? "secondary"
																						: "default"
																		}
																		className="cursor-pointer hover:opacity-80 transition-opacity"
																		onClick={() => handleAdjustStock(sku)}
																	>
																		{sku.estoque}
																	</Badge>
																</TooltipTrigger>
																<TooltipContent side="top" className="max-w-xs">
																	<div className="space-y-1">
																		<div className="font-semibold">
																			{t("inventory.adjust.tooltip.title")}
																		</div>
																		<div className="text-xs text-muted-foreground">
																			{t("inventory.adjust.tooltip.description")}
																		</div>
																	</div>
																</TooltipContent>
															</Tooltip>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>

									{/* Botão Carregar Mais */}
									{hasMore && (
										<div className="flex justify-center mt-4">
											<Button variant="outline" onClick={loadMore}>
												{t("common.loadMore")} (+{Math.min(ITEMS_PER_PAGE, filteredSkus.length - visibleCount)})
											</Button>
										</div>
									)}
								</>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Dialog de Ajuste de Estoque */}
			{selectedSkuForAdjust && (
				<AdjustStockDialog
					isOpen={adjustDialogOpen}
					onClose={handleCloseAdjustDialog}
					skuId={selectedSkuForAdjust.skuId}
					currentStock={selectedSkuForAdjust.currentStock}
					localId={selectedSkuForAdjust.localId}
					skuInfo={selectedSkuForAdjust.skuInfo}
					onSuccess={handleAdjustSuccess}
				/>
			)}
		</>
	);
};
