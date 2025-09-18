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
				/*
				{
					href: "/produtos",
					label: "Produtos",
					active: pathname.includes("/produtos"),
					icon: Shirt,
					submenus: [
						{
							href: "/produtos",
							label: "Primários",
							active: pathname === "/produtos",
						},
						{
							href: "/categoria",
							label: "Categorias",
							active: pathname === "/categorias",
							icon: Tags,
						},
						{
							href: "/compra",
							label: "Pedido de Compra",
							active: pathname === "/compra",
						},
					],
				},
				*/

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
							href: "/produto/transferencia",
							label: t("menu.products.transfers"),
							active: pathname.includes("/produto/categorias"),
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
							href: "/despesas",
							label: t("menu.expenses.panel"),
							active: pathname === "/despesas",
						},
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
					active: pathname.includes("/vendas"),
					icon: ShoppingCartIcon,
					submenus: [
						{
							href: "/pedidoVendas",
							label: t("menu.openOrders"),
							active: pathname === "/pedidoVendas",
						},
						{
							href: "/pedidoVendas/venda",
							label: t("menu.completedSales"),
							active: pathname === "/pedidoVendas/venda",
						},
						{
							href: "/pedidoVendas/condicionais",
							label: t("menu.conditionals"),
							active: pathname === "/pedidoVendas/condicionais",
						},
						{
							href: "/pedidoVendas/parcelamentos",
							label: t("menu.installments"),
							active: pathname === "/pedidoVendas/parcelamentos",
						},
					],
				},
			],
		},

		// Menu de administração - apenas para administradores
		...(userProfile?.nome === "ADMIN"
			? [
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
								href: "/formPagamento",
								label: t("menu.paymentMethods"),
								active: pathname.includes("/formPagamento"),
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
