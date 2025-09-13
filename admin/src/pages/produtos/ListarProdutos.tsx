import React from "react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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

	const handleCreateProduct = () => {
		// Por enquanto, apenas mostra um alerta
		alert("Página em construção!");
	};

	return (
		<DashboardLayout>
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
		</DashboardLayout>
	);
};
