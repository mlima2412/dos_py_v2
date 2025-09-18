import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Search, ShoppingCart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategoriasProduto } from "@/hooks/useCategoriaProduto";

import type { ProdutosPorLocalResponseDto } from "@/api-client/types";

interface ProductListingProps {
	products: ProdutosPorLocalResponseDto[];
	selectedProductId: number | null;
	onProductSelect: (productId: number) => void;
	isLoading: boolean;
	error: any;
}

export const ProductListing: React.FC<ProductListingProps> = ({
	products,
	selectedProductId,
	onProductSelect,
	isLoading,
	error,
}) => {
	const { t } = useTranslation("common");
	const [productSearch, setProductSearch] = React.useState("");
	const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

	const debouncedProductSearch = useDebounce(productSearch, 500);
	const { data: categorias } = useCategoriasProduto();

	// Filtrar produtos por busca e categoria
	const filteredProducts = React.useMemo(() => {
		if (!products) return [];

		let filtered = products;

		// Filtrar por busca
		if (debouncedProductSearch) {
			filtered = filtered.filter((produto: ProdutosPorLocalResponseDto) =>
				produto.nome
					.toLowerCase()
					.includes(debouncedProductSearch.toLowerCase())
			);
		}

		// Filtrar por categoria
		if (categoryFilter !== "all") {
			filtered = filtered.filter(
				(produto: ProdutosPorLocalResponseDto) =>
					produto.categoria?.id?.toString() === categoryFilter
			);
		}

		return filtered;
	}, [products, debouncedProductSearch, categoryFilter]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ShoppingCart className="h-5 w-5" />
					{t("inventory.view.products")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Filtros */}
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 mb-4">
					<div className="relative flex-1">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("inventory.view.searchProducts")}
							value={productSearch}
							onChange={e => setProductSearch(e.target.value)}
							className="pl-8"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-full md:w-[200px]">
							<SelectValue placeholder={t("inventory.view.filterByCategory")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("inventory.view.allCategories")}
							</SelectItem>
							{categorias?.map(categoria => (
								<SelectItem
									key={categoria.id}
									value={categoria.id?.toString() || ""}
								>
									{categoria.descricao}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Lista de Produtos */}
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">
							{t("inventory.view.loadingProducts")}
						</div>
					</div>
				) : error ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-destructive">
							{t("inventory.view.errorLoadingProducts")}
						</div>
					</div>
				) : filteredProducts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">
							{t("inventory.view.noProducts")}
						</div>
					</div>
				) : (
					<ScrollArea className="h-[450px] w-full rounded-md border">
						<div className="min-w-[300px]">
							<Table>
								<TableHeader className="sticky top-0 bg-background z-10">
									<TableRow>
										<TableHead className="h-8 py-2 bg-background">
											{t("inventory.view.productName")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredProducts.map(
										(produto: ProdutosPorLocalResponseDto) => (
											<TableRow
												key={produto.id}
												className={`cursor-pointer hover:bg-muted/50 ${
													selectedProductId === produto.id ? "bg-muted" : ""
												}`}
												onClick={() => onProductSelect(produto.id)}
											>
												<TableCell className="font-medium">
													{produto.nome}
												</TableCell>
											</TableRow>
										)
									)}
								</TableBody>
							</Table>
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
};
