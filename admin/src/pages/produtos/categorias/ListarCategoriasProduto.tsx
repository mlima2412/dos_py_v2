import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ListarCategorias } from "./components/ListarCategorias";
import { FormularioCategoria } from "./components/FormularioCategoria";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const ListarCategoriasProduto: React.FC = () => {
	const { t } = useTranslation("common");
	const [showForm, setShowForm] = useState(false);
	const [editingCategoryId, setEditingCategoryId] = useState<
		number | undefined
	>();

	const handleCreateCategory = () => {
		setEditingCategoryId(undefined);
		setShowForm(true);
	};

	const handleFormSuccess = () => {
		setShowForm(false);
		setEditingCategoryId(undefined);
	};

	const handleFormCancel = () => {
		setShowForm(false);
		setEditingCategoryId(undefined);
	};

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb e Botão Criar Categoria */}
				<div className="flex justify-between items-center">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{t("productCategories.title")}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Button variant="outline" size="sm" onClick={handleCreateCategory}>
						<Plus className="mr-2 h-4 w-4" />
						{t("productCategories.newCategory")}
					</Button>
				</div>

				{/* Conteúdo principal */}
				{showForm ? (
					<FormularioCategoria
						categoriaId={editingCategoryId}
						onSuccess={handleFormSuccess}
						onCancel={handleFormCancel}
					/>
				) : (
					<ListarCategorias />
				)}
			</div>
		
	);
};
