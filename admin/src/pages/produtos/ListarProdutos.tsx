import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ListarProdutosTable } from "./components/ListarProdutosTable";

export const ListarProdutos: React.FC = () => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();

	const handleCreateProduct = () => {
		navigate("/produtos/novo");
	};

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb e Botão Criar Produto */}
				<div className="flex justify-between items-center">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{t("products.list")}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Button variant="outline" size="sm" onClick={handleCreateProduct}>
						<Plus className="mr-2 h-4 w-4" />
						{t("products.new")}
					</Button>
				</div>

				{/* Conteúdo principal */}
				<ListarProdutosTable />
			</div>
		
	);
};
