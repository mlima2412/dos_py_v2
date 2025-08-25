import type { ColumnDef } from "@tanstack/react-table";
import type { SubCategoriaDespesaControllerFindAll200 } from "@/api-client/types";
import { SubCategoriaDespesaActions } from "./SubCategoriaDespesaActions.tsx";
import { useTranslation } from "react-i18next";

type SubCategoriaDespesaItem = SubCategoriaDespesaControllerFindAll200[0];

export const useSubCategoriaDespesaColumns =
	(): ColumnDef<SubCategoriaDespesaItem>[] => {
		const { t } = useTranslation();

		return [
			{
				accessorKey: "descricao",
				header: t("expenseSubtypes.columns.description"),
			},
			{
				accessorFn: row => row.categoria?.descricao || "N/A",
				id: "categoria",
				header: t("expenseSubtypes.columns.category"),
				meta: {
					className: "hidden lg:table-cell",
				},
			},
			{
				accessorKey: "ativo",
				header: t("expenseSubtypes.columns.status"),
				cell: ({ getValue }) => {
					const ativo = getValue() as boolean;
					return (
						<span
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
								ativo
									? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
									: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
							}`}
						>
							{ativo
								? t("expenseSubtypes.columns.active")
								: t("expenseSubtypes.columns.inactive")}
						</span>
					);
				},
				meta: {
					className: "hidden sm:table-cell",
				},
			},
			{
				accessorKey: "createdAt",
				header: t("expenseSubtypes.columns.createdAt"),
				cell: ({ getValue }) => {
					const date = getValue() as string;
					return new Date(date).toLocaleDateString("pt-BR");
				},
				meta: {
					className: "hidden md:table-cell",
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => (
					<SubCategoriaDespesaActions subcategoria={row.original} />
				),
				meta: {
					className: "w-[100px]",
				},
			},
		];
	};
