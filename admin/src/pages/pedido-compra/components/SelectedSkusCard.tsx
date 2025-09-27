import React from "react";
import { SelectedSkusList } from "@/components/SelectedSkusList";
import type { SelectedSkuItem } from "../types";

interface SelectedSkusCardProps {
	selectedSkus: SelectedSkuItem[];
	onRemoveSku: (skuId: number) => void;
	onUpdateQuantity: (skuId: number, quantity: number) => void;
	emptyMessage?: string;
	title?: string;
	isEnabled?: boolean;
}

const SelectedSkusCardComponent: React.FC<SelectedSkusCardProps> = ({
	selectedSkus,
	onRemoveSku,
	onUpdateQuantity,
	emptyMessage,
	title,
	isEnabled = true,
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
			enabledStockAdjustment={isEnabled}
		/>
	);
};

export const SelectedSkusCard = React.memo(SelectedSkusCardComponent);
