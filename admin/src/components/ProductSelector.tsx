import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	const selectedProduct = products.find(p => p.id === selectedProductId);

	// Filtrar produtos por busca
	const filteredProducts = useMemo(() => {
		if (!searchValue) return products;
		return products.filter(product =>
			product.nome.toLowerCase().includes(searchValue.toLowerCase())
		);
	}, [products, searchValue]);

	const handleSelect = (productId: number) => {
		if (disabled) return;
		onProductSelect(productId);
		setOpen(false);
		setSearchValue("");
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">
					{loadingMessage || t("inventory.view.loadingProducts")}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-destructive">
					{errorMessage || t("inventory.view.errorLoadingProducts")}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium">
				{t("purchaseOrders.form.labels.product")}
			</label>
			<Popover open={open && !disabled} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={disabled}
					>
						<span
							className={cn(
								"truncate",
								!selectedProduct && "text-muted-foreground"
							)}
						>
							{selectedProduct
								? selectedProduct.nome
								: placeholder || t("purchaseOrders.form.placeholders.product")}
						</span>
						<ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command>
						<CommandInput
							placeholder={
								searchPlaceholder || t("inventory.view.searchProducts")
							}
							value={searchValue}
							onValueChange={setSearchValue}
						/>
						<CommandList>
							<CommandEmpty>
								{emptyMessage || t("inventory.view.noProducts")}
							</CommandEmpty>
							<CommandGroup>
								{filteredProducts.map(product => (
									<CommandItem
										key={product.id}
										value={product.nome}
										onSelect={() => handleSelect(product.id)}
									>
										{product.nome}
										{selectedProductId === product.id && (
											<CheckIcon className="ml-auto h-4 w-4" />
										)}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};
