import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FormularioCategoria } from "./components/FormularioCategoria";
import { useCategoriaProduto } from "@/hooks/useCategoriaProduto";
import { LoadingMessage } from "@/components/ui/TableSkeleton";

export const EditarCategoriaProduto: React.FC = () => {
	const { t } = useTranslation("common");
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const categoriaId = id ? parseInt(id, 10) : 0;

	const {
		data: categoria,
		isLoading,
		error,
	} = useCategoriaProduto(categoriaId);

	const handleSuccess = () => {
		navigate("/produto/categorias");
	};

	const handleCancel = () => {
		navigate("/produto/categorias");
	};

	if (isLoading) {
		return (
			
				<div className="space-y-6">
					<LoadingMessage columns={1} message={t("common.loading")} />
				</div>
			
		);
	}

	if (error || !categoria) {
		return (
			
				<div className="space-y-6">
					<LoadingMessage columns={1} message={t("common.loadError")} />
				</div>
			
		);
	}

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/produto/categorias">
								{t("productCategories.title")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{t("productCategories.editCategory")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Formulário */}
				<FormularioCategoria
					categoriaId={categoriaId}
					onSuccess={handleSuccess}
					onCancel={handleCancel}
				/>
			</div>
		
	);
};
