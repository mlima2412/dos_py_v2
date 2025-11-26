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
	produtosError: Error | null;
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
	isCondicionalAberta?: boolean; // Indica se é uma condicional em modo devolução
	onProcessarDevolucao?: (skuId: number) => Promise<void>; // Handler para processar devolução
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
	isCondicionalAberta = false,
	onProcessarDevolucao,
}) => {
	const { t } = useTranslation("common");
	const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
	const [editingSkuId, setEditingSkuId] = useState<number | null>(null);
	const [editingItemPrice, setEditingItemPrice] = useState(0);
	const [pendingAddition, setPendingAddition] = useState<{
		sku: ProdutoSKUEstoqueResponseDto;
		product: ProdutosPorLocalResponseDto;
	} | null>(null);
	const isViewMode = (mode as string) === "view";

	const handleEditDiscount = (skuId: number) => {
		if (isViewMode) return;
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
		if (isViewMode) return;

		// Set pending addition and open dialog
		setPendingAddition({ sku, product });
		setEditingSkuId(null);
		setEditingItemPrice(Number(product.precoVenda ?? 0));
		setDiscountDialogOpen(true);
	};

	const handleBarcodeSearch = async () => {
		// Se é condicional aberta, processar devolução
		if (isCondicionalAberta && onProcessarDevolucao) {
			// Buscar o SKU diretamente nos itens da venda ao invés do estoque
			if (!skuSearchCode.trim()) {
				return;
			}

			try {
				const skuId = parseInt(skuSearchCode.slice(-3), 10);
				if (Number.isNaN(skuId)) {
					return;
				}

				// Verificar se o SKU existe nos itens da venda
				const itemNaVenda = itensSelecionados.find(item => item.skuId === skuId);
				if (!itemNaVenda) {
					// SKU não pertence a esta venda
					return;
				}

				// Processar devolução
				await onProcessarDevolucao(skuId);

				// Limpar o campo de busca
				setSkuSearchCode("");
			} catch (error) {
				console.error("Erro ao processar código de barras para devolução:", error);
			}
			return;
		}

		// Comportamento normal: adicionar item
		const result = await findSkuByCode();
		if (result) {
			// Open dialog with the found SKU
			await handleAddSkuWithDiscount(result.sku, result.product);
		}
	};

	const handleDiscountConfirm = async (discountValue: number, discountType: "VALOR" | "PERCENTUAL") => {
		if (editingSkuId !== null) {
			// Editing existing item
			await handlers.onUpdateDiscount(editingSkuId, discountValue, discountType);
		} else if (pendingAddition) {
			// Adding new item
			await handlers.onAddSku(
				pendingAddition.sku,
				pendingAddition.product,
				discountValue,
				discountType
			);
		}
		setPendingAddition(null);
		setEditingSkuId(null);
	};

	// Calcular efetividade da condicional
	const calcularEfetividade = () => {
		if (!isCondicionalAberta) return null;

		const totalReservado = itensSelecionados.reduce((acc, item) => acc + item.qtdReservada, 0);
		const totalDevolvido = itensSelecionados.reduce((acc, item) => acc + (item.qtdDevolvida ?? 0), 0);
		const totalAceito = totalReservado - totalDevolvido;

		if (totalReservado === 0) return { percentual: 0, aceitos: 0, devolvidos: 0, total: 0 };

		const percentual = (totalAceito / totalReservado) * 100;
		return {
			percentual: Math.round(percentual),
			aceitos: totalAceito,
			devolvidos: totalDevolvido,
			total: totalReservado
		};
	};

	const efetividade = calcularEfetividade();

	return (
		<div className="space-y-4">
			{mode === "create" && !vendaId && (
				<Card>
					<CardContent className="py-6 text-sm text-muted-foreground">
						{t("salesOrders.form.messages.saveBasicFirst")}
					</CardContent>
				</Card>
			)}
			<div className={`grid gap-4 ${isCondicionalAberta || isViewMode ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
				{!isViewMode && !isCondicionalAberta && (
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
									disabled={isViewMode || !selectedLocal}
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
						<div className="flex items-center justify-between">
							<CardTitle>
								{isCondicionalAberta
									? t("salesOrders.form.sections.returnItems")
									: t("salesOrders.form.sections.selectedItems")}
							</CardTitle>
							{efetividade && (
								<div className="flex flex-col items-end gap-1">
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">
											{t("salesOrders.form.labels.effectiveness")}:
										</span>
										<span className={`text-lg font-bold ${
											efetividade.percentual >= 70 ? 'text-green-600' :
											efetividade.percentual >= 40 ? 'text-orange-600' :
											'text-red-600'
										}`}>
											{efetividade.percentual}%
										</span>
										<span className="text-xs text-muted-foreground">
											({efetividade.aceitos}/{efetividade.total})
										</span>
									</div>
									{efetividade.devolvidos > 0 && (
										<span className="text-xs text-muted-foreground">
											{efetividade.devolvidos} {efetividade.devolvidos === 1 ? 'item devolvido' : 'itens devolvidos'}
										</span>
									)}
								</div>
							)}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								value={skuSearchCode}
								onChange={event => {
									// Permitir apenas números e hífen, formato XXX-XXX
									const value = event.target.value.replace(/[^0-9-]/g, "");
									// Limitar a 7 caracteres (XXX-XXX)
									if (value.length <= 7) {
										setSkuSearchCode(value);
									}
								}}
								placeholder={
									isCondicionalAberta
										? t("salesOrders.form.placeholders.scanToReturn")
										: t("salesOrders.form.placeholders.barcode")
								}
								disabled={!isCondicionalAberta && isViewMode}
								autoFocus={isCondicionalAberta}
								maxLength={7}
								onKeyDown={event => {
									if (event.key === "Enter") {
										event.preventDefault();
										void handleBarcodeSearch();
									}
								}}
							/>
						</div>
						{isCondicionalAberta && (
							<div className="text-sm text-orange-600 font-medium">
								{t("salesOrders.form.messages.scanToReturnMode")}
							</div>
						)}
						<SelectedSkusList
							ref={selectedSkusRef}
							selectedSkus={itensSelecionados.map(item => {
								const qtdDevolvida = item.qtdDevolvida ?? 0;
								const qtdAceita = item.qtdReservada - qtdDevolvida;
								return {
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
									quantity: isCondicionalAberta ? qtdAceita : item.qtdReservada,
									discount: item.desconto,
									price: item.precoUnit,
									qtdDevolvida: item.qtdDevolvida,
									qtdReservada: item.qtdReservada,
								};
							})}
							onRemoveSku={handlers.onRemoveItem}
							onUpdateQuantity={handlers.onUpdateQuantity}
											enabledStockAdjustment={!isViewMode && !isCondicionalAberta}
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

			{!isViewMode && !isCondicionalAberta && (
				<div className="flex justify-between pt-2">
					<Button variant="outline" onClick={onBack}>
						{t("salesOrders.form.actions.back")}
					</Button>
					<Button onClick={onNext} disabled={itensSelecionados.length === 0}>
						{t("salesOrders.form.actions.next")}
					</Button>
				</div>
			)}
			{isCondicionalAberta && (
				<div className="flex justify-between pt-2">
					<Button variant="outline" onClick={onBack}>
						{t("salesOrders.form.actions.back")}
					</Button>
					<Button onClick={onNext}>
						{t("salesOrders.form.actions.proceedToPayment")}
					</Button>
				</div>
			)}

			<DiscountDialog
				open={discountDialogOpen}
				onOpenChange={setDiscountDialogOpen}
				currentDiscountType={
					editingSkuId !== null
						? (itensSelecionados.find(i => i.skuId === editingSkuId)
								?.descontoTipo ?? "VALOR")
						: "VALOR"
				}
				currentDiscountValue={
					editingSkuId !== null
						? (itensSelecionados.find(i => i.skuId === editingSkuId)
								?.descontoValor ?? 0)
						: 0
				}
				itemPrice={editingItemPrice}
				onConfirm={handleDiscountConfirm}
			/>
		</div>
	);
};
