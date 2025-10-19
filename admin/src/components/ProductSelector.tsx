import React from "react";
import { useTranslation } from "react-i18next";
import { ItemSelector } from "./ItemSelector";

export interface ProductSelectorProps {
	products: Array<{
		id: number;
		nome: string;
		[key: string]: unknown;
	}>;
	selectedProductId: number | null;
	onProductSelect: (productId: number) => void;
	isLoading?: boolean;
	error?: unknown;
	disabled?: boolean;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	loadingMessage?: string;
	errorMessage?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
	products,
	selectedProductId,
	onProductSelect,
	isLoading = false,
	error = null,
	disabled = false,
	placeholder,
	searchPlaceholder,
	emptyMessage,
	loadingMessage,
	errorMessage,
}) => {
	const { t } = useTranslation("common");

	return (
		<ItemSelector
			items={products}
			selectedItemId={selectedProductId}
			onItemSelect={onProductSelect}
			isLoading={isLoading}
			error={error}
			disabled={disabled}
			placeholder={placeholder}
			searchPlaceholder={searchPlaceholder}
			emptyMessage={emptyMessage}
			loadingMessage={loadingMessage}
			errorMessage={errorMessage}
			label={t("purchaseOrders.form.labels.product")}
		/>
	);
};
