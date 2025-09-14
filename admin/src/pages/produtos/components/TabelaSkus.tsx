import { useState, useMemo } from "react";
import { Edit, Trash2, Search, Circle, Plus } from "lucide-react";
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
import { ColorPickerDialog } from "./ColorPickerDialog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DialogSku } from "./DialogSku";

interface SkuData {
	id: number;
	publicId: string;
	cor?: string;
	codCor?: string;
	tamanho?: string;
	qtdMinima: number;
	dataUltimaCompra?: string;
	produto?: {
		id: number;
		nome: string;
	};
}

interface TabelaSkusProps {
	skus: SkuData[];
	isLoading: boolean;
	onEdit: (sku: SkuData) => void;
	onDelete: (skuId: string) => void;
	onColorChange: (skuId: string, codCor: string) => void;
	onCreateSku: (skuData: {
		cor: string;
		tamanho: string;
		qtdMinima: number;
		codCor?: string;
	}) => void;
	produto: {
		id: number;
		nome: string;
		imgURL?: string;
	};
}

export function TabelaSkus({
	skus,
	isLoading,
	onEdit,
	onDelete,
	onColorChange,
	onCreateSku,
	produto,
}: TabelaSkusProps) {
	const { t } = useTranslation();
	const [searchTerm, setSearchTerm] = useState("");
	const [isSkuDialogOpen, setIsSkuDialogOpen] = useState(false);
	const [editingSku, setEditingSku] = useState<SkuData | null>(null);

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
		<div className="flex flex-col h-full space-y-4">
			<div className="flex items-center justify-between flex-shrink-0">
				<h3 className="text-lg font-semibold">{t("products.skus.title")}</h3>
				<div className="flex items-center space-x-4">
					<div className="relative w-64">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder={t("products.skus.searchPlaceholder")}
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Dialog open={isSkuDialogOpen} onOpenChange={setIsSkuDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								{t("products.actions.newSku")}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{t("products.skus.newSku")} - {produto?.nome}
								</DialogTitle>
							</DialogHeader>
							<DialogSku
								onSubmit={data => {
									onCreateSku(data);
									setIsSkuDialogOpen(false);
								}}
								onClose={() => {
									setIsSkuDialogOpen(false);
									setEditingSku(null);
								}}
								editingSku={
									editingSku
										? {
												cor: editingSku.cor || "",
												tamanho: editingSku.tamanho || "",
												qtdMinima: editingSku.qtdMinima,
												codCor: editingSku.codCor,
											}
										: undefined
								}
								onUpdate={data => {
									onEdit(data as SkuData);
									setIsSkuDialogOpen(false);
									setEditingSku(null);
								}}
							/>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{filteredSkus.length === 0 && searchTerm ? (
				<div className="text-center py-8 text-muted-foreground flex-1 flex items-center justify-center">
					{t("products.skus.noSearchResults")}
				</div>
			) : (
				<div className="flex-1 overflow-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-center">
									{t("products.skus.columns.code")}
								</TableHead>
								<TableHead>{t("products.skus.columns.color")}</TableHead>
								<TableHead className="text-center">
									{t("products.skus.columns.colorVisual")}
								</TableHead>
								<TableHead className="text-center">
									{t("products.skus.columns.size")}
								</TableHead>
								<TableHead className="text-center">
									{t("products.skus.columns.minQuantity")}
								</TableHead>
								<TableHead>{t("products.skus.columns.lastPurchase")}</TableHead>
								<TableHead className="w-[120px]">
									{t("products.skus.columns.actions")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredSkus.map(sku => (
								<TableRow key={sku.id}>
									<TableCell className="text-center font-mono text-sm">
										{String(sku.produto?.id || 0).padStart(3, "0")}-
										{String(sku.id).padStart(3, "0")}
									</TableCell>
									<TableCell>
										{sku.cor || (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										{sku.codCor ? (
											<Circle
												size={40}
												fill={`#${sku.codCor.toString().padStart(6, "0")}`}
												className="mx-auto"
											/>
										) : null}
									</TableCell>
									<TableCell className="text-center">
										{sku.tamanho || (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell className="text-center">{sku.qtdMinima}</TableCell>
									<TableCell>
										{sku.dataUltimaCompra ? (
											new Date(sku.dataUltimaCompra).toLocaleDateString()
										) : (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell>
										<div className="flex items-center space-x-1">
											<ColorPickerDialog
												sku={sku}
												onColorChange={onColorChange}
											/>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0"
												onClick={() => onEdit(sku)}
												title={t("products.skus.actions.edit")}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0"
												onClick={() => onDelete(sku.publicId)}
												title={t("products.skus.actions.delete")}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
