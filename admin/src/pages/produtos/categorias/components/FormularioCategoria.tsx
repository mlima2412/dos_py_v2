import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import {
	categoriaProdutoSchema,
	type CategoriaProdutoFormData,
} from "../categoriaSchema";
import {
	useCategoriaProdutoForm,
	useCategoriaProduto,
} from "@/hooks/useCategoriaProduto";

interface FormularioCategoriaProps {
	categoriaId?: number;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export const FormularioCategoria: React.FC<FormularioCategoriaProps> = ({
	categoriaId,
	onSuccess,
	onCancel,
}) => {
	const { t } = useTranslation("common");
	const { createCategoria, updateCategoria, isLoading } =
		useCategoriaProdutoForm();

	// Buscar dados da categoria se estiver editando
	const { data: categoriaData, isLoading: isLoadingCategoria } =
		useCategoriaProduto(categoriaId || 0);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
	} = useForm<CategoriaProdutoFormData>({
		resolver: zodResolver(categoriaProdutoSchema),
		defaultValues: {
			descricao: "",
		},
	});

	// Carregar dados da categoria no formulário quando estiver editando
	useEffect(() => {
		if (categoriaData && categoriaId) {
			setValue("descricao", categoriaData.descricao || "");
		}
	}, [categoriaData, categoriaId, setValue]);

	const onSubmit = async (data: CategoriaProdutoFormData) => {
		try {
			console.log("Dados do formulário:", data);
			console.log("Tipo dos dados:", typeof data);
			console.log("Propriedades:", Object.keys(data));
			console.log("Valor de descricao:", data.descricao);
			console.log("Tipo de descricao:", typeof data.descricao);

			if (categoriaId) {
				console.log("Atualizando categoria:", categoriaId, data);
				await updateCategoria(categoriaId, data);
			} else {
				console.log("Criando categoria:", data);
				await createCategoria(data);
			}
			reset();
			onSuccess?.();
		} catch (error) {
			console.error("Erro ao salvar categoria:", error);
		}
	};

	if (isLoadingCategoria && categoriaId) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-center py-8">
						<div className="text-sm text-muted-foreground">
							{t("common.loading")}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{categoriaId
						? t("productCategories.editCategory")
						: t("productCategories.createCategory")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="descricao">
							{t("productCategories.columns.name")} *
						</Label>
						<Input
							id="descricao"
							placeholder={t("productCategories.placeholders.name")}
							{...register("descricao")}
							disabled={isLoading}
						/>
						{errors.descricao && (
							<p className="text-sm text-destructive">
								{t(errors.descricao.message || "")}
							</p>
						)}
					</div>

					<div className="flex justify-end space-x-2">
						{onCancel && (
							<Button
								type="button"
								variant="outline"
								onClick={onCancel}
								disabled={isLoading}
							>
								<X className="mr-2 h-4 w-4" />
								{t("common.cancel")}
							</Button>
						)}
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									{categoriaId ? t("common.updating") : t("common.creating")}
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									{categoriaId ? t("common.update") : t("common.create")}
								</>
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
};
