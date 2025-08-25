import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { CategoriaDespesasControllerFindAll200 } from "@/api-client/types";
import { CategoriaDespesasActions } from "./CategoriaDespesasActions";
import { useTranslation } from "react-i18next";

type CategoriaDespesasItem = CategoriaDespesasControllerFindAll200[0];

interface ColumnMeta {
	className?: string;
}

type CategoriaDespesasColumnDef = ColumnDef<CategoriaDespesasItem> & {
	meta?: ColumnMeta;
};

export const useCategoriaDespesasColumns = (): CategoriaDespesasColumnDef[] => {
	const { t } = useTranslation();

	return [
		{
			accessorKey: "idCategoria",
			header: t("expenseTypes.columns.id"),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("idCategoria")}</div>
			),
		},
		{
			accessorKey: "descricao",
			header: t("expenseTypes.columns.description"),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("descricao")}</div>
			),
		},
		{
			accessorKey: "ativo",
			header: t("expenseTypes.columns.status"),
			cell: ({ row }) => {
				const ativo = row.getValue("ativo") as boolean;
				return (
					<Badge variant={ativo ? "default" : "secondary"}>
						{ativo
							? t("expenseTypes.columns.active")
							: t("expenseTypes.columns.inactive")}
					</Badge>
				);
			},
			meta: {
				className: "hidden md:table-cell",
			},
		},
		{
			accessorKey: "createdAt",
			header: t("expenseTypes.columns.createdAt"),
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as string;
				return (
					<div className="text-sm text-muted-foreground">
						{date ? new Date(date).toLocaleDateString("pt-BR") : "-"}
					</div>
				);
			},
			meta: {
				className: "hidden md:table-cell",
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				return <CategoriaDespesasActions categoria={row.original} />;
			},
		},
	];
};
