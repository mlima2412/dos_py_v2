import { useState, useMemo } from "react";
import { Edit, Trash2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

interface TabelaSkusProps {
	skus: any[];
	isLoading: boolean;
	onEdit: (sku: any) => void;
	onDelete: (skuId: string) => void;
}

export function TabelaSkus({
	skus,
	isLoading,
	onEdit,
	onDelete,
}: TabelaSkusProps) {
	const { t } = useTranslation();
	const [searchTerm, setSearchTerm] = useState("");

	// Filtrar SKUs baseado no termo de busca
	const filteredSkus = useMemo(() => {
		if (!searchTerm) return skus;

		return skus.filter(
			sku =>
				(sku.cor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
				(sku.tamanho || "").toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [skus, searchTerm]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-32">
				<Spinner size="lg" />
			</div>
		);
	}

	if (skus.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				{t("products.skus.noResults")}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">{t("products.skus.title")}</h3>
				<div className="relative w-64">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder={t("products.skus.searchPlaceholder")}
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{filteredSkus.length === 0 && searchTerm ? (
				<div className="text-center py-8 text-muted-foreground">
					{t("products.skus.noSearchResults")}
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("products.skus.columns.color")}</TableHead>
							<TableHead>{t("products.skus.columns.size")}</TableHead>
							<TableHead>{t("products.skus.columns.minQuantity")}</TableHead>
							<TableHead>{t("products.skus.columns.lastPurchase")}</TableHead>
							<TableHead className="w-[100px]">
								{t("products.skus.columns.actions")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredSkus.map(sku => (
							<TableRow key={sku.id}>
								<TableCell>
									{sku.cor || <span className="text-muted-foreground">-</span>}
								</TableCell>
								<TableCell>
									{sku.tamanho || (
										<span className="text-muted-foreground">-</span>
									)}
								</TableCell>
								<TableCell>{sku.qtdMinima}</TableCell>
								<TableCell>
									{sku.dataUltimaCompra ? (
										new Date(sku.dataUltimaCompra).toLocaleDateString()
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</TableCell>
								<TableCell>
									<div className="flex items-center space-x-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onEdit(sku)}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onDelete(sku.publicId)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
