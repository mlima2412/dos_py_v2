import {
	Users,
	Home,
	Truck,
	LayoutGrid,
	LucideIcon,
	Shirt,
	Tags,
	Handshake,
	Blinds,
	BadgeDollarSign,
	CreditCardIcon,
	ShoppingCartIcon,
	UserCheck,
	Radio,
	FolderTree,
} from "lucide-react";

type Submenu = {
	href: string;
	label: string;
	active: boolean;
};

type Menu = {
	href: string;
	label: string;
	active: boolean;
	icon: LucideIcon;
	submenus: Submenu[];
};

type Group = {
	groupLabel: string;
	menus: Menu[];
};

export function getMenuList(
	pathname: string,
	t: (key: string) => string,
	userProfile?: { id: number; nome: string } | null
): Group[] {
	const isSalesDashboard = pathname.includes("/pedidoVendas/dashboard");
	const isExpenseDashboard =
		pathname === "/despesas" || pathname === "/despesas/";
	const isSalesReport =
		pathname.includes("/pedidoVendas/relatorios") ||
		pathname.includes("/pedidoVendas/relatorio");
	const isExpenseReport =
		pathname.includes("/despesas/relatorios") ||
		pathname.includes("/despesas/relatorio");

	return [
		{
			groupLabel: "",
			menus: [
				{
					href: "/inicio",
					label: t("menu.home"),
					active: pathname === "/",
					icon: Home,
					submenus: [],
				},
			],
		},
		{
			groupLabel: t("menu.registrations"),
			menus: [
				{
					href: "/clientes",
					label: t("menu.clients"),
					active: pathname.includes("/clientes"),
					icon: Handshake,
					submenus: [],
				},
				{
					href: "/fornecedores",
					label: t("suppliers.title"),
					active: pathname.includes("/fornecedores"),
					icon: Truck,
					submenus: [],
				},

				{
					href: "/produtos",
					label: t("menu.products.main"),
					active: pathname.includes("/produtos"),
					icon: Shirt,
					submenus: [
						{
							href: "/produtos",
							label: t("menu.products.list"),
							active: pathname === "/produtos",
						},
						{
							href: "/estoques/visualizar",
							label: t("menu.products.stocks"),
							active: pathname.includes("/estoques/visualizar"),
						},
						{
							href: "/produtos/listar-transferencia",
							label: t("menu.products.transfers"),
							active:
								pathname.includes("/produtos/listar-transferencia") ||
								pathname.includes("/produtos/transferencia"),
						},
						{
							href: "/produtos/conferencia",
							label: t("menu.products.conferences"),
							active: pathname.includes("/produtos/conference"),
						},
						{
							href: "/produto/categorias",
							label: t("menu.products.categories"),
							active: pathname.includes("/produto/categorias"),
						},
					],
				},
				{
					href: "/pedidoCompra",
					label: t("menu.purchaseOrders"),
					active: pathname.includes("/pedidoCompra"),
					icon: Tags,
					submenus: [],
				},
				{
					href: "/despesas",
					label: t("menu.expenses.main"),
					active: pathname.includes("/despesas"),
					icon: BadgeDollarSign,
					submenus: [
						{
							href: "/despesas/correntes",
							label: t("menu.expenses.actual"),
							active: pathname.includes("/despesas/correntes"),
						},
						{
							href: "/despesas/contas-pagar",
							label: t("menu.expenses.payable"),
							active: pathname.includes("/despesas/contas-pagar"),
						},
						{
							href: "/despesas/recorrentes",
							label: t("menu.expenses.recurring"),
							active: pathname.includes("/despesas/recorrentes"),
						},
					],
				},

				{
					href: "/vendas",
					label: t("menu.sales"),
					active:
						pathname.includes("/vendas") || pathname.includes("/pedidoVendas"),
					icon: ShoppingCartIcon,
					submenus: [
						{
							href: "/pedidoVendas/pedidos",
							label: t("menu.openOrders"),
							active: pathname.includes("/pedidoVendas/pedidos"),
						},
						{
							href: "/pedidoVendas/vendas",
							label: t("menu.completedSales"),
							active: pathname.includes("/pedidoVendas/vendas"),
						},
						{
							href: "/pedidoVendas/condicionais",
							label: t("menu.conditionals"),
							active: pathname.includes("/pedidoVendas/condicionais"),
						},
						{
							href: "/pedidoVendas/brinde",
							label: t("menu.giftsAndExchanges"),
							active: pathname.includes("/pedidoVendas/brinde"),
						},
						{
							href: "/pedidoVendas/parcelamentos",
							label: t("menu.installments"),
							active: pathname.includes("/pedidoVendas/parcelamentos"),
						},
					],
				},
			],
		},
		// Menu de administração - apenas para administradores
		...(userProfile?.nome === "ADMIN"
			? [
					{
						groupLabel: t("menu.finances"),
						menus: [
							{
								href: "/pedidoVendas/dashboard",
								label: t("menu.dashboards.main"),
								active: isSalesDashboard || isExpenseDashboard,
								icon: LayoutGrid,
								submenus: [
									{
										href: "/pedidoVendas/dashboard",
										label: t("menu.dashboards.sales"),
										active: isSalesDashboard,
									},
									{
										href: "/despesas",
										label: t("menu.dashboards.expenses"),
										active: isExpenseDashboard,
									},
								],
							},
							{
								href: "/pedidoVendas/relatorios",
								label: t("menu.reports.main"),
								active: isSalesReport || isExpenseReport,
								icon: FolderTree,
								submenus: [
									{
										href: "/pedidoVendas/relatorios",
										label: t("menu.reports.sales"),
										active: isSalesReport,
									},
									{
										href: "/despesas/relatorios",
										label: t("menu.reports.expenses"),
										active: isExpenseReport,
									},
								],
							},
						],
					},
					{
						groupLabel: t("menu.administration"),
						menus: [
							{
								href: "/dashboard",
								label: t("dashboard.title"),
								active: pathname.includes("/dashboard"),
								icon: LayoutGrid,
								submenus: [],
							},
							{
								href: "/usuarios",
								label: t("menu.users"),
								active: pathname.includes("/usuarios"),
								icon: Users,
								submenus: [],
							},
							{
								href: "/parceiros",
								label: t("menu.partners"),
								active: pathname.includes("/parceiros"),
								icon: UserCheck,
								submenus: [],
							},
							{
								href: "/estoques",
								label: t("menu.inventory"),
								active: pathname.includes("/estoques"),
								icon: Blinds,
								submenus: [],
							},
							{
								href: "/formaPagamento",
								label: t("menu.paymentMethods"),
								active: pathname.includes("/formaPagamento"),
								icon: CreditCardIcon,
								submenus: [],
							},
							{
								href: "/canais-origem",
								label: t("administration.originChannels"),
								active: pathname.includes("/canais-origem"),
								icon: Radio,
								submenus: [],
							},
							{
								href: "/tipos-despesa",
								label: t("administration.expenseTypes"),
								active: pathname.includes("/tipos-despesa"),
								icon: FolderTree,
								submenus: [],
							},
							{
								href: "/subtipos-despesa",
								label: t("administration.expenseSubtypes"),
								active: pathname.includes("/subtipos-despesa"),
								icon: FolderTree,
								submenus: [],
							},
						],
					},
				]
			: []),
	];
}
