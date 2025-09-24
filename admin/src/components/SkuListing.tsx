import React from "react";
import { useTranslation } from "react-i18next";
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
import { Search, Package, ShoppingCart, Edit3 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";

import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

interface SkuListingProps {
	selectedProduct: ProdutosPorLocalResponseDto | null;
	selectedProductId: number | null;
	skus: ProdutoSKUEstoqueResponseDto[];
	isLoading: boolean;
	error: unknown;
	enableStockAdjustment?: boolean;
	onStockAdjust?: (sku: ProdutoSKUEstoqueResponseDto) => void;
	onDoubleClick?: (sku: ProdutoSKUEstoqueResponseDto) => void;
	allowZeroStock?: boolean;
	showProductPrice?: boolean;
	onPriceChange?: (newPrice: number) => void;
}

const SkuListing: React.FC<SkuListingProps> = ({
	selectedProduct,
	selectedProductId,
	skus,
	isLoading,
	error,
	enableStockAdjustment = false,
	onStockAdjust,
	onDoubleClick,
	allowZeroStock = false,
	showProductPrice = false,
	onPriceChange,
}) => {
	const { t } = useTranslation("common");
	const [skuSearch, setSkuSearch] = React.useState("");
	const [sizeFilter, setSizeFilter] = React.useState<string>("all");
	const [isPriceDialogOpen, setIsPriceDialogOpen] = React.useState(false);
	const [newPrice, setNewPrice] = React.useState<string>("");

	const debouncedSkuSearch = useDebounce(skuSearch, 500);

	// Filtrar SKUs por busca e tamanho
	const filteredSkus = React.useMemo(() => {
		if (!selectedProductId || !skus) return [];

		let filtered = skus;

		// Filtrar por busca (código ou cor)
		if (debouncedSkuSearch) {
			filtered = filtered.filter((sku: ProdutoSKUEstoqueResponseDto) => {
				const searchTerm = debouncedSkuSearch.toLowerCase();
				const skuCode =
					`${selectedProduct?.id?.toString().padStart(3, "0")}-${sku.id.toString().padStart(3, "0")}`.toLowerCase();
				const color = sku.cor?.toLowerCase() || "";

				return skuCode.includes(searchTerm) || color.includes(searchTerm);
			});
		}

		// Filtrar por tamanho
		if (sizeFilter !== "all") {
			filtered = filtered.filter(
				(sku: ProdutoSKUEstoqueResponseDto) => sku.tamanho === sizeFilter
			);
		}

		return filtered;
	}, [
		selectedProductId,
		skus,
		debouncedSkuSearch,
		sizeFilter,
		selectedProduct?.id,
	]);

	// Obter tamanhos únicos dos SKUs
	const availableSizes = React.useMemo(() => {
		if (!skus) return [];
		return skus
			.map((sku: ProdutoSKUEstoqueResponseDto) => sku.tamanho)
			.filter((size, index, self) => size && self.indexOf(size) === index)
			.sort();
	}, [skus]);

	// Limpar filtros quando mudar o produto
	React.useEffect(() => {
		setSkuSearch("");
		setSizeFilter("all");
	}, [selectedProductId]);

	const handleStockClick = (sku: ProdutoSKUEstoqueResponseDto) => {
		if (enableStockAdjustment && onStockAdjust) {
			onStockAdjust(sku);
		}
	};

	const handlePriceClick = () => {
		if (selectedProduct) {
			setNewPrice(selectedProduct.precoCompra.toString());
			setIsPriceDialogOpen(true);
		}
	};

	const handlePriceSave = () => {
		const priceValue = parseFloat(newPrice);
		if (!isNaN(priceValue) && priceValue >= 0 && onPriceChange) {
			onPriceChange(priceValue);
			setIsPriceDialogOpen(false);
		}
	};

	const handlePriceCancel = () => {
		setIsPriceDialogOpen(false);
		setNewPrice("");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<div className="flex justify-between">
						<div className="flex items-center gap-2">
							<Package className="h-5 w-5" />{" "}
							{selectedProduct && `${selectedProduct.nome}`}
						</div>
						{showProductPrice && (
							<div
								className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
								onClick={handlePriceClick}
							>
								{/* Formatar o preço de compra */}
								{selectedProduct?.currency?.prefixo}{" "}
								{selectedProduct?.precoCompra.toLocaleString(
									selectedProduct?.currency?.isoCode || "pt-BR",
									{
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}
								)}
								<Edit3 className="h-3 w-3 opacity-50" />
							</div>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Filtros para SKUs */}
				{selectedProductId && (
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 mb-4">
						<div className="relative flex-1">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t("inventory.view.searchSkus")}
								value={skuSearch}
								onChange={e => setSkuSearch(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Select value={sizeFilter} onValueChange={setSizeFilter}>
							<SelectTrigger className="w-full md:w-[200px]">
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
				)}

				{!selectedProductId ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">
								{t("inventory.view.selectProduct")}
							</p>
						</div>
					</div>
				) : isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">
							{t("inventory.view.loadingSkus")}
						</div>
					</div>
				) : error ? (
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
					<ScrollArea className="h-[450px] w-full rounded-md border">
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
									{filteredSkus.map((sku: ProdutoSKUEstoqueResponseDto) => (
										<TableRow
											key={`${sku.id}-${sku.publicId}`}
											onDoubleClick={() => {
												if (allowZeroStock || sku.estoque > 0) {
													onDoubleClick?.(sku);
												}
											}}
											className={
												onDoubleClick && (allowZeroStock || sku.estoque > 0)
													? "cursor-pointer hover:bg-muted/50"
													: onDoubleClick && !allowZeroStock && sku.estoque <= 0
														? "cursor-not-allowed opacity-50"
														: ""
											}
										>
											<TableCell className="font-mono text-sm text-center">
												{selectedProduct?.id.toString().padStart(3, "0")}-
												{sku.id.toString().padStart(3, "0")}
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
												{enableStockAdjustment ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<Badge
																variant={
																	sku.estoque <= sku.qtdMinima
																		? "destructive"
																		: sku.estoque <= sku.qtdMinima * 2
																			? "secondary"
																			: "default"
																}
																className="cursor-pointer hover:opacity-80 transition-opacity"
																onClick={() => handleStockClick(sku)}
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
												) : (
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
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</ScrollArea>
				)}
			</CardContent>

			{/* Dialog para ajuste de preço */}
			<Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>{t("inventory.priceAdjust.title")}</DialogTitle>
						<DialogDescription>
							{t("inventory.priceAdjust.description")}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="current-price" className="text-right">
								{t("inventory.priceAdjust.currentPrice")}
							</Label>
							<div className="col-span-3 text-sm text-muted-foreground">
								{selectedProduct?.currency?.prefixo}{" "}
								{selectedProduct?.precoCompra.toLocaleString(
									selectedProduct?.currency?.isoCode || "pt-BR",
									{
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="new-price" className="text-right">
								{t("inventory.priceAdjust.newPrice")}
							</Label>
							<Input
								id="new-price"
								type="number"
								step="0.01"
								min="0"
								value={newPrice}
								onChange={e => setNewPrice(e.target.value)}
								className="col-span-3"
								placeholder={t("inventory.priceAdjust.enterNewPrice")}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={handlePriceCancel}>
							{t("common.cancel")}
						</Button>
						<Button onClick={handlePriceSave}>{t("common.save")}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
};

export { SkuListing };
