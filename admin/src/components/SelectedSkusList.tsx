import { useRef, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, ShoppingCart } from "lucide-react";
import { SelectedSkuItem } from "./SelectedSkuItem";

export interface SelectedSkusListProps<T = Record<string, unknown>> {
	selectedSkus: Array<{
		sku: T & {
			id: number;
			cor?: string;
			codCor?: string | number;
			tamanho?: string;
		};
		product: T & {
			id: number;
			nome: string;
		};
		quantity: number;
		discount?: number;
		price?: number;
		qtdDevolvida?: number; // Quantidade devolvida (vendas condicionais)
		qtdReservada?: number; // Quantidade reservada total
	}>;
	onRemoveSku: (skuId: number) => void;
	onUpdateQuantity: (skuId: number, quantity: number) => void;
	title?: string;
	emptyMessage?: string;
	showStockLimit?: boolean;
	maxQuantity?: (sku: T & { id: number }) => number;
	scrollAreaHeight?: string;
	enabledStockAdjustment?: boolean;
	showDiscount?: boolean;
	onEditDiscount?: (skuId: number) => void;
}

export interface SelectedSkusListRef {
	scrollToItem: (skuId: number) => void;
}

const SelectedSkusListComponent = forwardRef<
	SelectedSkusListRef,
	SelectedSkusListProps
>(
	(
		{
			selectedSkus,
			onRemoveSku,
			onUpdateQuantity,
			title,
			emptyMessage,
			showStockLimit = false,
			maxQuantity,
			scrollAreaHeight = "h-[400px]",
			enabledStockAdjustment = true,
			showDiscount = false,
			onEditDiscount,
		},
		ref
	) => {
		const { t } = useTranslation("common");
		const scrollAreaRef = useRef<HTMLDivElement>(null);
		const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

		useImperativeHandle(ref, () => ({
			scrollToItem: (skuId: number) => {
				const itemElement = itemRefs.current.get(skuId);
				if (itemElement && scrollAreaRef.current) {
					// Encontrar o container de scroll
					const scrollContainer = scrollAreaRef.current.querySelector(
						"[data-radix-scroll-area-viewport]"
					);
					if (scrollContainer) {
						// Calcular a posição do item em relação ao container
						const containerRect = scrollContainer.getBoundingClientRect();
						const itemRect = itemElement.getBoundingClientRect();
						const scrollTop = scrollContainer.scrollTop;
						const itemTop = itemRect.top - containerRect.top + scrollTop;

						// Fazer scroll suave para o item
						scrollContainer.scrollTo({
							top: itemTop - 20, // 20px de margem do topo
							behavior: "smooth",
						});

						// Destacar o item temporariamente
						itemElement.classList.add(
							"ring-2",
							"ring-blue-500",
							"ring-opacity-50",
							"border-blue-500",
							"border-2"
						);
						setTimeout(() => {
							itemElement.classList.remove(
								"ring-2",
								"ring-blue-500",
								"ring-opacity-50",
								"border-blue-500",
								"border-2"
							);
						}, 2000);
					}
				}
			},
		}));

		const handleIncrement = (
			skuId: number,
			currentQuantity: number,
			sku: Record<string, unknown> & { id: number }
		) => {
			if (showStockLimit && maxQuantity) {
				const maxQty = maxQuantity(sku);
				const newQuantity = Math.min(currentQuantity + 1, maxQty);
				onUpdateQuantity(skuId, newQuantity);
			} else {
				// Para pedido de compra, não há limite de estoque
				const newQuantity = currentQuantity + 1;
				onUpdateQuantity(skuId, newQuantity);
			}
		};

		const handleDecrement = (skuId: number, currentQuantity: number) => {
			const newQuantity = Math.max(currentQuantity - 1, 1);
			onUpdateQuantity(skuId, newQuantity);
		};

		// Calcular total de itens (quantidade aceita, não devolvida)
		const totalItems = selectedSkus.reduce(
			(sum, item) => sum + item.quantity,
			0
		);

		// Calcular quantidade de SKUs únicos (excluindo totalmente devolvidos)
		const uniqueItems = selectedSkus.filter(item => item.quantity > 0).length;

		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center justify-between text-base">
						<div className="flex items-center gap-2">
							<ShoppingCart className="h-4 w-4" />
							{title || t("purchaseOrders.form.labels.selectedProducts")}
						</div>
						<div>
							{uniqueItems > 0 && (
								<span className="text-xs font-normal text-muted-foreground">
									{uniqueItems} {uniqueItems === 1 ? "item" : "itens"}, {totalItems}{" "}
									{totalItems === 1 ? "pc" : "pcs"}
								</span>
							)}
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					{selectedSkus.length === 0 ? (
						<div className="flex items-center justify-center py-6">
							<div className="text-center">
								<Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
								<p className="text-sm text-muted-foreground">
									{emptyMessage || t("purchaseOrders.form.noProductsSelected")}
								</p>
							</div>
						</div>
					) : (
						<ScrollArea
							ref={scrollAreaRef}
							className={`${scrollAreaHeight} w-full rounded-md`}
						>
							<div className="space-y-1 pr-2">
								{selectedSkus.map(({ sku, product, quantity, discount, price, qtdDevolvida, qtdReservada }) => {
									const maxQty =
										showStockLimit && maxQuantity
											? maxQuantity(sku)
											: undefined;
									const isAtMaxLimit =
										maxQty !== undefined && quantity >= maxQty;

									// Determinar se o item foi totalmente devolvido
									const isReturned = qtdReservada !== undefined &&
										qtdDevolvida !== undefined &&
										qtdDevolvida >= qtdReservada;

									return (
										<SelectedSkuItem
											key={sku.id}
											sku={sku}
											product={product}
											quantity={quantity}
											onRemove={onRemoveSku}
											onIncrement={handleIncrement}
											onDecrement={handleDecrement}
											isAtMaxLimit={isAtMaxLimit}
											enabledStockAdjustment={enabledStockAdjustment}
											setRef={(skuId, el) => {
												if (el) {
													itemRefs.current.set(skuId, el);
												} else {
													itemRefs.current.delete(skuId);
												}
											}}
											showDiscount={showDiscount}
											discount={discount}
											price={price}
											onDoubleClick={onEditDiscount}
											qtdDevolvida={qtdDevolvida}
											qtdReservada={qtdReservada}
											isReturned={isReturned}
										/>
									);
								})}
							</div>
						</ScrollArea>
					)}
				</CardContent>
			</Card>
		);
	}
);

SelectedSkusListComponent.displayName = "SelectedSkusList";

export const SelectedSkusList = SelectedSkusListComponent;
