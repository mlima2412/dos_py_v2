import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, ShoppingCart, Plus, Minus, X } from "lucide-react";

export interface SelectedSkusListProps<T = any> {
	selectedSkus: Array<{
		sku: T & {
			id: number;
			cor?: string;
			codCor?: string;
			tamanho?: string;
		};
		product: T & {
			id: number;
			nome: string;
		};
		quantity: number;
	}>;
	onRemoveSku: (skuId: number) => void;
	onUpdateQuantity: (skuId: number, quantity: number) => void;
	title?: string;
	emptyMessage?: string;
	showStockLimit?: boolean;
	maxQuantity?: (sku: T) => number;
	scrollAreaHeight?: string;
	enabledStockAdjustment?: boolean;
}

export const SelectedSkusList: React.FC<SelectedSkusListProps> = ({
	selectedSkus,
	onRemoveSku,
	onUpdateQuantity,
	title,
	emptyMessage,
	showStockLimit = false,
	maxQuantity,
	scrollAreaHeight = "h-[400px]",
	enabledStockAdjustment = true,
}) => {
	const { t } = useTranslation("common");

	const handleIncrement = (
		skuId: number,
		currentQuantity: number,
		sku: any
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

	const totalItems = selectedSkus.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ShoppingCart className="h-5 w-5" />
						{title || t("purchaseOrders.form.labels.selectedProducts")}
					</div>
					<div>
						{selectedSkus.length > 0 && (
							<span className="text-base font-normal text-muted-foreground">
								{totalItems} {totalItems === 1 ? "item" : "itens"}
							</span>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{selectedSkus.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">
								{emptyMessage || t("purchaseOrders.form.noProductsSelected")}
							</p>
						</div>
					</div>
				) : (
					<ScrollArea className={`${scrollAreaHeight} w-full rounded-md`}>
						<div className="space-y-2 pr-2">
							{selectedSkus.map(({ sku, product, quantity }) => {
								const maxQty =
									showStockLimit && maxQuantity ? maxQuantity(sku) : undefined;
								const isAtMaxLimit = maxQty !== undefined && quantity >= maxQty;

								return (
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
																	backgroundColor: `#${sku.codCor}`,
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
										{enabledStockAdjustment && (
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
															handleIncrement(sku.id, quantity, sku)
														}
														disabled={isAtMaxLimit}
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
										)}
									</div>
								);
							})}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
};
