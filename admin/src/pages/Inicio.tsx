import React from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, ShoppingCart, Package, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const Inicio: React.FC = () => {
	const { t } = useTranslation();

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						{t("menu.home")}
					</h1>
					<p className="text-muted-foreground mt-2">
						{t("dashboard.homeWelcome")}
					</p>
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card className="hover:shadow-md transition-shadow cursor-pointer">
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-2">
								<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
									<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								</div>
								<CardTitle className="text-sm">{t("menu.clients")}</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground mb-3">
								{t("dashboard.manageClients")}
							</p>
							<Button size="sm" variant="outline" asChild>
								<Link to="/clientes">
									{t("common.access")} <ArrowRight className="ml-1 h-3 w-3" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow cursor-pointer">
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-2">
								<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
									<Package className="h-4 w-4 text-green-600 dark:text-green-400" />
								</div>
								<CardTitle className="text-sm">
									{t("menu.products.main")}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground mb-3">
								Catálogo de produtos
							</p>
							<Button size="sm" variant="outline" asChild>
								<Link to="/produtos">
									Acessar <ArrowRight className="ml-1 h-3 w-3" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow cursor-pointer">
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-2">
								<div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
									<ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
								</div>
								<CardTitle className="text-sm">Vendas</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground mb-3">
								Gestão de vendas
							</p>
							<Button size="sm" variant="outline" asChild>
								<Link to="/vendas">
									Acessar <ArrowRight className="ml-1 h-3 w-3" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow cursor-pointer">
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-2">
								<div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
									<Tags className="h-4 w-4 text-orange-600 dark:text-orange-400" />
								</div>
								<CardTitle className="text-sm">Compras</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground mb-3">
								Gestão de compras
							</p>
							<Button size="sm" variant="outline" asChild>
								<Link to="/pedidoCompra">
									Acessar <ArrowRight className="ml-1 h-3 w-3" />
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Recent Activity */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Atividades Recentes</CardTitle>
							<CardDescription>Últimas ações no sistema</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-start space-x-3">
									<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
									<div className="flex-1">
										<p className="text-sm font-medium">
											Novo cliente cadastrado
										</p>
										<p className="text-xs text-muted-foreground">
											João Silva - há 2 minutos
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
									<div className="flex-1">
										<p className="text-sm font-medium">Venda finalizada</p>
										<p className="text-xs text-muted-foreground">
											Pedido #1234 - há 5 minutos
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
									<div className="flex-1">
										<p className="text-sm font-medium">Produto atualizado</p>
										<p className="text-xs text-muted-foreground">
											Camiseta Polo - há 10 minutos
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Resumo do Dia</CardTitle>
							<CardDescription>Estatísticas de hoje</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Vendas</span>
									<span className="font-medium">R$ 2.450,00</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Pedidos</span>
									<span className="font-medium">12</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">
										Novos Clientes
									</span>
									<span className="font-medium">3</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">
										Produtos Vendidos
									</span>
									<span className="font-medium">45</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</DashboardLayout>
	);
};
