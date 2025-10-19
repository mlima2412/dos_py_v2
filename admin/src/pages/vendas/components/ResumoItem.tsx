import React from "react";
import type { VendaItemFormData } from "../types";

interface ResumoItemProps {
	item: VendaItemFormData;
	formatCurrency: (value: number) => string;
}

export const ResumoItem: React.FC<ResumoItemProps> = ({
	item,
	formatCurrency,
}) => {
	const itemTotal = item.qtdReservada * item.precoUnit - (item.desconto ?? 0);

	return (
		<div className="flex items-center justify-between">
			<span>
				{item.productName || item.skuLabel || "-"} ({item.qtdReservada} x{" "}
				{formatCurrency(item.precoUnit)})
			</span>
			<span>{formatCurrency(itemTotal)}</span>
		</div>
	);
};
