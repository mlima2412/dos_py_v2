import React from "react";
import { SelectedSkusList } from "@/components/SelectedSkusList";
import type { SelectedSkuItem } from "../types";

interface SelectedSkusCardProps {
	selectedSkus: SelectedSkuItem[];
	onRemoveSku: (skuId: number) => void;
	onUpdateQuantity: (skuId: number, quantity: number) => void;
	emptyMessage?: string;
	title?: string;
}

const SelectedSkusCardComponent: React.FC<SelectedSkusCardProps> = ({
	selectedSkus,
	onRemoveSku,
	onUpdateQuantity,
	emptyMessage,
	title,
}) => {
	return (
		<SelectedSkusList
			selectedSkus={selectedSkus}
			onRemoveSku={onRemoveSku}
			onUpdateQuantity={onUpdateQuantity}
			showStockLimit={false}
			scrollAreaHeight="h-[800px]"
			emptyMessage={emptyMessage}
			title={title}
		/>
	);
};

export const SelectedSkusCard = React.memo(SelectedSkusCardComponent);
