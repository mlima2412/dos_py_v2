import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ProductSelector } from "@/components";
import { SkuListing } from "@/components/SkuListing";
import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

interface ProductSkuPickerCardProps {
	isLocationSelected: boolean;
	selectLocationMessage: string;
	products: ProdutosPorLocalResponseDto[];
	selectedProductId: number | null;
	onProductSelect: (productId: number) => void;
	isLoadingProducts: boolean;
	errorProducts: unknown;
	selectedProduct: ProdutosPorLocalResponseDto | null;
	skus: ProdutoSKUEstoqueResponseDto[];
	onAddSku: (sku: ProdutoSKUEstoqueResponseDto) => void;
	onPriceChange: (price: number) => void;
	labels: {
		productSkus: string;
		doubleClickToAdd: string;
	};
}

const ProductSkuPickerCardComponent: React.FC<ProductSkuPickerCardProps> = ({
	isLocationSelected,
	selectLocationMessage,
	products,
	selectedProductId,
	onProductSelect,
	isLoadingProducts,
	errorProducts,
	selectedProduct,
	skus,
	onAddSku,
	onPriceChange,
	labels,
}) => {
	return (
		<Card>
			<CardContent className="pt-6 space-y-4">
				{!isLocationSelected ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">{selectLocationMessage}</div>
					</div>
				) : (
					<>
						<ProductSelector
							products={products}
							selectedProductId={selectedProductId}
							onProductSelect={onProductSelect}
							isLoading={isLoadingProducts}
							error={errorProducts}
							disabled={!isLocationSelected}
						/>

						{selectedProductId && (
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									{labels.productSkus}
								</Label>
								<p className="text-sm text-muted-foreground">
									{labels.doubleClickToAdd}
								</p>
								<SkuListing
									selectedProduct={selectedProduct}
									selectedProductId={selectedProductId}
									skus={skus}
									isLoading={isLoadingProducts}
									error={errorProducts}
									enableStockAdjustment={false}
									onDoubleClick={onAddSku}
									allowZeroStock
									showProductPrice
									onPriceChange={onPriceChange}
								/>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
};

export const ProductSkuPickerCard = React.memo(ProductSkuPickerCardComponent);
