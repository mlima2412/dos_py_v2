import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Edit,
	Power,
	PowerOff,
} from "lucide-react";
import { type Fornecedor } from "@/api-client";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { HoverActions } from "@/components/ui/HoverActions";
import { type HoverAction } from "@/hooks/useStandardActions";
import {
	useFornecedoresControllerActivateFornecedor,
	useFornecedoresControllerDeactivateFornecedor,
} from "@/api-client";
import { useToast } from "@/hooks/useToast";

type FornecedorWithRelations = Fornecedor;

export const createColumns = (
	t: (key: string) => string,
	activateFornecedor: ReturnType<
		typeof useFornecedoresControllerActivateFornecedor
	>,
	deactivateFornecedor: ReturnType<
		typeof useFornecedoresControllerDeactivateFornecedor
	>,
	toast: ReturnType<typeof useToast>
): ColumnDef<FornecedorWithRelations>[] => [
	{
		accessorKey: "nome",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-semibold"
			>
				{t("suppliers.name")}
				{column.getIsSorted() === "asc" ? (
					<ArrowUp className="ml-2 h-4 w-4" />
				) : column.getIsSorted() === "desc" ? (
					<ArrowDown className="ml-2 h-4 w-4" />
				) : (
					<ArrowUpDown className="ml-2 h-4 w-4" />
				)}
			</Button>
		),
		cell: ({ row }) => (
			<div className="font-medium">{row.getValue("nome")}</div>
		),
	},
	{
		accessorKey: "email",
		header: t("suppliers.email"),
		cell: ({ row }) => (
			<div className="text-muted-foreground">
				{row.getValue("email") || "-"}
			</div>
		),
	},
	{
		accessorKey: "telefone",
		header: t("suppliers.phone"),
		cell: ({ row }) => <div>{row.getValue("telefone") || "-"}</div>,
	},
	{
		accessorKey: "ruccnpj",
		header: t("suppliers.rucCnpj"),
		cell: ({ row }) => <div>{row.getValue("ruccnpj") || "-"}</div>,
	},
	{
		accessorKey: "ultimaCompra",
		header: t("suppliers.lastPurchase"),
		cell: ({ row }) => {
			const date = row.getValue("ultimaCompra") as string | null;
			return (
				<div>
					{date
						? format(new Date(date), "dd/MM/yyyy", { locale: ptBR })
						: t("suppliers.neverPurchase")}
				</div>
			);
		},
	},
	{
		accessorKey: "ativo",
		header: t("suppliers.status.label"),
		cell: ({ row }) => {
			const ativo = row.getValue("ativo") as boolean;
			return (
				<Badge variant={ativo ? "default" : "destructive"}>
					{ativo
						? t("suppliers.status.active")
						: t("suppliers.status.inactive")}
				</Badge>
			);
		},
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => {
			const fornecedor = row.original;
			const isActive = fornecedor.ativo;

			const handleToggle = async () => {
				try {
					if (isActive) {
						await deactivateFornecedor.mutateAsync({
							publicId: fornecedor.publicId,
						});
						toast.success(t("suppliers.messages.deactivateSuccess"));
					} else {
						await activateFornecedor.mutateAsync({
							publicId: fornecedor.publicId,
						});
						toast.success(t("suppliers.messages.activateSuccess"));
					}
				} catch {
					toast.error(
						isActive
							? t("suppliers.messages.deactivateError")
							: t("suppliers.messages.activateError")
					);
				}
			};

			const actions: HoverAction[] = [
				{
					type: "edit",
					label: t("common.edit"),
					icon: <Edit className="h-4 w-4" />,
					href: `/fornecedores/editar/${fornecedor.publicId}`,
					variant: "ghost",
				},
				{
					type: "toggle",
					label: isActive ? t("suppliers.deactivate") : t("suppliers.activate"),
					icon: isActive ? (
						<PowerOff className="h-4 w-4" />
					) : (
						<Power className="h-4 w-4" />
					),
					onClick: handleToggle,
					variant: isActive ? "destructive" : "default",
				},
			];

			return <HoverActions actions={actions} />;
		},
	},
];

export const useResponsiveColumns = (
	t: (key: string) => string,
	isMobile: boolean
): ColumnDef<FornecedorWithRelations>[] => {
	const activateFornecedor = useFornecedoresControllerActivateFornecedor();
	const deactivateFornecedor = useFornecedoresControllerDeactivateFornecedor();
	const toast = useToast();

	return useMemo(() => {
		const allColumns = createColumns(
			t,
			activateFornecedor,
			deactivateFornecedor,
			toast
		);

		if (isMobile) {
			// Em mobile, mostrar apenas nome, status e ações
			return [
				allColumns[0], // nome
				allColumns[5], // status
				allColumns[6], // actions
			];
		}

		return allColumns;
	}, [t, isMobile, activateFornecedor, deactivateFornecedor, toast]);
};

export const useIsMobile = () => {
	return useMediaQuery("(max-width: 768px)");
};
