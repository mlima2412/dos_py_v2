import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductSelector, SkuListing, SelectedSkusList } from "@/components";
import type { SkuListingRef } from "@/components/SkuListing";
import type { SelectedSkusListRef } from "@/components/SelectedSkusList";
import type {
	VendaFormMode,
	VendaItemFormData,
	VendaTotals,
	VendaFormHandlers,
	LocalOption,
} from "../types";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";
import { DiscountDialog } from "./DiscountDialog";

interface SelecaoItensProps {
	mode: VendaFormMode;
	vendaId?: number;
	produtosDisponiveis: ProdutosPorLocalResponseDto[];
	isLoadingProdutos: boolean;
	produtosError: any;
	selectedLocal: LocalOption | null;
	selectedProductId: number | null;
	setSelectedProductId: (id: number | null) => void;
	skuSearchCode: string;
	setSkuSearchCode: (code: string) => void;
	itensSelecionados: VendaItemFormData[];
	totals: VendaTotals;
	formatCurrency: (value: number) => string;
	handlers: VendaFormHandlers;
	skuListingRef: React.RefObject<SkuListingRef | null>;
	selectedSkusRef: React.RefObject<SelectedSkusListRef | null>;
	findSkuByCode: () => Promise<{
		sku: ProdutoSKUEstoqueResponseDto;
		product: ProdutosPorLocalResponseDto;
	} | null>;
	onBack: () => void;
	onNext: () => void;
}

export const SelecaoItens: React.FC<SelecaoItensProps> = ({
	mode,
	vendaId,
	produtosDisponiveis,
	isLoadingProdutos,
	produtosError,
	selectedLocal,
	selectedProductId,
	setSelectedProductId,
	skuSearchCode,
	setSkuSearchCode,
	itensSelecionados,
	totals,
	formatCurrency,
	handlers,
	skuListingRef,
	selectedSkusRef,
	findSkuByCode,
	onBack,
	onNext,
}) => {
	const { t } = useTranslation("common");
	const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
	const [editingSkuId, setEditingSkuId] = useState<number | null>(null);
	const [editingItemPrice, setEditingItemPrice] = useState(0);
	const [pendingAddition, setPendingAddition] = useState<{
		sku: ProdutoSKUEstoqueResponseDto;
		product: ProdutosPorLocalResponseDto;
	} | null>(null);

	const handleEditDiscount = (skuId: number) => {
		if (mode === "view") return;
		const item = itensSelecionados.find(i => i.skuId === skuId);
		if (item) {
			setEditingSkuId(skuId);
			setEditingItemPrice(item.precoUnit);
			setDiscountDialogOpen(true);
		}
	};

	const handleAddSkuWithDiscount = async (
		sku: ProdutoSKUEstoqueResponseDto,
		product: ProdutosPorLocalResponseDto
	) => {
		if (mode === "view") return;

		// Set pending addition and open dialog
		setPendingAddition({ sku, product });
		setEditingSkuId(null);
		setEditingItemPrice(Number(product.precoVenda ?? 0));
		setDiscountDialogOpen(true);
	};

	const handleBarcodeSearch = async () => {
		// Find the SKU first without adding it
		const result = await findSkuByCode();
		if (result) {
			// Open dialog with the found SKU
			await handleAddSkuWithDiscount(result.sku, result.product);
		}
	};

	const handleDiscountConfirm = async (discount: number) => {
		if (editingSkuId !== null) {
			// Editing existing item
			await handlers.onUpdateDiscount(editingSkuId, discount);
		} else if (pendingAddition) {
			// Adding new item
			await handlers.onAddSku(
				pendingAddition.sku,
				pendingAddition.product,
				discount
			);
		}
		setPendingAddition(null);
		setEditingSkuId(null);
	};

	return (
		<div className="space-y-4">
			{mode === "create" && !vendaId && (
				<Card>
					<CardContent className="py-6 text-sm text-muted-foreground">
						{t("salesOrders.form.messages.saveBasicFirst")}
					</CardContent>
				</Card>
			)}
			<div className="grid gap-4 lg:grid-cols-2">
				{mode !== "view" && (
					<Card className="h-full">
						<CardHeader>
							<CardTitle>
								{t("salesOrders.form.sections.availableProducts")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<ProductSelector
								products={produtosDisponiveis}
								selectedProductId={selectedProductId}
								onProductSelect={value => setSelectedProductId(value)}
								isLoading={isLoadingProdutos}
								error={produtosError}
								disabled={mode === "view" || !selectedLocal}
								placeholder={t("salesOrders.form.placeholders.product")}
							/>
							<ScrollArea className="h-[620px] rounded-md border">
								<SkuListing
									ref={skuListingRef}
									selectedProduct={
										produtosDisponiveis.find(
											product => product.id === selectedProductId
										) || null
									}
									selectedProductId={selectedProductId}
									skus={
										produtosDisponiveis.find(
											product => product.id === selectedProductId
										)?.ProdutoSKU || []
									}
									isLoading={isLoadingProdutos}
									error={produtosError}
									onDoubleClick={(sku: ProdutoSKUEstoqueResponseDto) => {
										const product =
											produtosDisponiveis.find(prod =>
												prod.ProdutoSKU?.some(item => item.id === sku.id)
											) || null;
										if (product) {
											void handleAddSkuWithDiscount(sku, product);
										}
									}}
									allowZeroStock={false}
									showProductPrice={false}
								/>
							</ScrollArea>
						</CardContent>
					</Card>
				)}

				<Card className="h-full">
					<CardHeader>
						<CardTitle>
							{t("salesOrders.form.sections.selectedItems")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								value={skuSearchCode}
								onChange={event => setSkuSearchCode(event.target.value)}
								placeholder={t("salesOrders.form.placeholders.barcode")}
								disabled={mode === "view"}
								onKeyDown={event => {
									if (event.key === "Enter") {
										event.preventDefault();
										void handleBarcodeSearch();
									}
								}}
							/>
						</div>
						<SelectedSkusList
							ref={selectedSkusRef}
							selectedSkus={itensSelecionados.map(item => ({
								sku: {
									id: item.skuId,
									cor: item.skuColor ?? undefined,
									codCor: item.skuColorCode ?? undefined,
									tamanho: item.skuSize ?? undefined,
								},
								product: {
									id: item.productId ?? item.skuId,
									nome: item.productName || "-",
								},
								quantity: item.qtdReservada,
								discount: item.desconto,
								price: item.precoUnit,
							}))}
							onRemoveSku={handlers.onRemoveItem}
							onUpdateQuantity={handlers.onUpdateQuantity}
							enabledStockAdjustment={mode !== "view"}
							emptyMessage={t("salesOrders.form.messages.noItemsSelected")}
							showDiscount={true}
							onEditDiscount={handleEditDiscount}
						/>
						<div className="flex flex-row justify-between space-x-4">
							<div className="text-sm font-semibold border rounded-md border-red-400 p-1 w-[150px]">
								<p>{t("salesOrders.form.labels.subtotal")}: </p>
								<p>{formatCurrency(totals.itensSubtotal)}</p>
							</div>
							<div className="text-sm font-semibold border rounded-md border-red-400 p-1 w-[150px]">
								<p>{t("salesOrders.form.labels.discountItems")} </p>
								<p>{formatCurrency(totals.descontoItens)}</p>
							</div>

							<div className="text-sm font-semibold border rounded-md border-red-400 p-1 w-[150px]">
								<p>{t("salesOrders.form.labels.total")}: </p>
								<p>{formatCurrency(totals.total)}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{mode !== "view" && (
				<div className="flex justify-between pt-2">
					<Button variant="outline" onClick={onBack}>
						{t("salesOrders.form.actions.back")}
					</Button>
					<Button onClick={onNext} disabled={itensSelecionados.length === 0}>
						{t("salesOrders.form.actions.next")}
					</Button>
				</div>
			)}

			<DiscountDialog
				open={discountDialogOpen}
				onOpenChange={setDiscountDialogOpen}
				currentDiscount={
					editingSkuId !== null
						? (itensSelecionados.find(i => i.skuId === editingSkuId)
								?.desconto ?? 0)
						: 0
				}
				itemPrice={editingItemPrice}
				onConfirm={handleDiscountConfirm}
			/>
		</div>
	);
};
