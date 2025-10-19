import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export interface SelectedSkuItemProps<T = any> {
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
	onRemove: (skuId: number) => void;
	onIncrement: (skuId: number, currentQuantity: number, sku: any) => void;
	onDecrement: (skuId: number, currentQuantity: number) => void;
	isAtMaxLimit?: boolean;
	enabledStockAdjustment?: boolean;
	setRef?: (skuId: number, element: HTMLDivElement | null) => void;
	showDiscount?: boolean;
	discount?: number;
	price?: number;
	onDoubleClick?: (skuId: number) => void;
}

export const SelectedSkuItem = <T,>({
	sku,
	product,
	quantity,
	onRemove,
	onIncrement,
	onDecrement,
	isAtMaxLimit = false,
	enabledStockAdjustment = true,
	setRef,
	showDiscount = false,
	discount = 0,
	price = 0,
	onDoubleClick,
}: SelectedSkuItemProps<T>) => {
	const { formatCurrency } = useCurrencyFormatter();

	// Calculate final price (price - discount)
	const finalPrice = price - (discount || 0);

	return (
		<div
			ref={el => setRef?.(sku.id, el)}
			className="flex items-center justify-between p-1.5 border rounded-md transition-all duration-300 hover:border-[#FB5A4F] cursor-pointer"
			onDoubleClick={() => onDoubleClick?.(sku.id)}
		>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1">
					<span className="font-mono text-xs">
						{product.id.toString().padStart(3, "0")}-
						{sku.id.toString().padStart(3, "0")}
					</span>
					{sku.cor && (
						<div className="flex items-center gap-0.5">
							{sku.codCor && (
								<div
									className="w-2 h-2 rounded-full border"
									style={{
										backgroundColor: `#${sku.codCor}`,
									}}
								/>
							)}
							<span className="text-xs text-muted-foreground">{sku.cor}</span>
						</div>
					)}
					{sku.tamanho && (
						<span className="text-xs text-muted-foreground">{sku.tamanho}</span>
					)}
				</div>
				<p className="text-xs font-medium truncate mt-0.5">{product.nome}</p>
			</div>
			<div className="flex items-center gap-1">
				{showDiscount && price > 0 && (
					<div className="flex flex-col items-end">
						{discount > 0 && (
							<span className="text-xs text-muted-foreground line-through">
								{formatCurrency(price)}
							</span>
						)}
						<span className="text-xs font-medium">
							{formatCurrency(finalPrice)}
						</span>
					</div>
				)}
				<div className="flex items-center gap-0.5">
					{enabledStockAdjustment && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onDecrement(sku.id, quantity)}
							disabled={quantity <= 1}
							className="h-5 w-5 p-0"
						>
							<Minus className="h-2.5 w-2.5" />
						</Button>
					)}
					<span className="w-8 text-center text-xs font-medium">
						{quantity}
					</span>
					{enabledStockAdjustment && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onIncrement(sku.id, quantity, sku)}
							disabled={isAtMaxLimit}
							className="h-5 w-5 p-0"
						>
							<Plus className="h-2.5 w-2.5" />
						</Button>
					)}
				</div>
				{enabledStockAdjustment && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onRemove(sku.id)}
						className="h-5 w-5 p-0 text-destructive hover:text-destructive"
					>
						<Trash2 className="h-2.5 w-2.5" />
					</Button>
				)}
			</div>
		</div>
	);
};
