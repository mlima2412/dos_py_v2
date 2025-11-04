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
import { Package, MapPin } from "lucide-react";
import { AdjustStockDialog } from "./components/AdjustStockDialog";
import { ProductSelector, SkuListing } from "@/components";

import { useLocaisEstoque } from "@/hooks/useEstoques";
import { useProdutoControllerFindByLocal } from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useConferenciaEstoqueControllerCheckLocalEmConferencia } from "@/api-client/hooks/useConferenciaEstoqueControllerCheckLocalEmConferencia";
import { useToast } from "@/hooks/useToast";

import type { LocalEstoque } from "@/api-client/types";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

export const VisualizarEstoque: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();
	const { error: toastError } = useToast();

	const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
		null
	);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);

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

	// Obter SKUs do produto selecionado
	const selectedProductSkus = useMemo(() => {
		if (!selectedProductId || !produtosData) return [];

		const selectedProduct = produtosData.find(
			(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
		);

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

	// Encontrar o produto selecionado
	const selectedProduct =
		produtosData?.find(
			(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
		) || null;

	// Função para abrir o dialog de ajuste de estoque
	const handleAdjustStock = (sku: ProdutoSKUEstoqueResponseDto) => {
		if (!selectedProduct || !selectedLocationId) return;

		// Verificar se o local está em conferência
		if (localEmConferencia?.emConferencia) {
			toastError(t("inventory.adjust.conference.message"));
			return;
		}

		setSelectedSkuForAdjust({
			skuId: sku.id,
			currentStock: sku.estoque,
			localId: selectedLocationId,
			skuInfo: {
				productName: selectedProduct.nome,
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
		// Por exemplo, invalidar a query dos produtos para atualizar os dados
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

				{/* Produtos e SKUs - Layout lado a lado */}
				{selectedLocationId && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Card de Produtos */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5" />
									{t("inventory.view.products")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ProductSelector
									products={produtosData || []}
									selectedProductId={selectedProductId}
									onProductSelect={setSelectedProductId}
									isLoading={isLoadingProducts}
									error={errorProducts}
									placeholder={t("inventory.view.selectProduct")}
								/>
							</CardContent>
						</Card>

						{/* Card de SKUs */}
						<SkuListing
							selectedProduct={selectedProduct}
							selectedProductId={selectedProductId}
							skus={selectedProductSkus}
							isLoading={isLoadingProducts}
							error={errorProducts}
							enableStockAdjustment={true}
							onStockAdjust={handleAdjustStock}
						/>
					</div>
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
