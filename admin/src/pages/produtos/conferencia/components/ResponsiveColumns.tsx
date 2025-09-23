import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConferenciaEstoque } from "@/api-client/types";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";

interface UseResponsiveColumnsProps {
	t: (key: string) => string;
	isMobile: boolean;
	onView: (conferencia: ConferenciaEstoque) => void;
	onDelete: (conferencia: ConferenciaEstoque) => void;
	locale: string;
}

export function useResponsiveColumns({
	t,
	isMobile,
	onView,
	onDelete,
	locale,
}: UseResponsiveColumnsProps): ColumnDef<ConferenciaEstoque>[] {
	const dateLocale = locale === "es" ? es : ptBR;

	const getStatusColor = (status: string) => {
		switch (status) {
			case "PENDENTE":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "EM_ANDAMENTO":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "FINALIZADA":
				return "bg-green-100 text-green-800 border-green-200";
			case "CANCELADA":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const formatDate = (dateString: string) => {
		try {
			return format(new Date(dateString), "dd/MM/yyyy HH:mm", {
				locale: dateLocale,
			});
		} catch {
			return dateString;
		}
	};

	const baseColumns: ColumnDef<ConferenciaEstoque>[] = [
		{
			accessorKey: "dataInicio",
			header: t("conference.columns.date"),
			cell: ({ row }) => {
				const data = row.getValue("dataInicio") as string;
				return <div className="text-sm">{formatDate(data)}</div>;
			},
		},
		{
			accessorKey: "localNome",
			header: t("conference.columns.location"),
			cell: ({ row }) => {
				const localNome = row.original.localNome;
				return <div className="text-sm font-medium">{localNome || "-"}</div>;
			},
		},
		{
			accessorKey: "Usuario",
			header: t("conference.columns.user"),
			cell: ({ row }) => {
				const usuario = row.original.Usuario;
				return <div className="text-sm">{usuario || "-"}</div>;
			},
		},
		{
			accessorKey: "dataFim",
			header: t("conference.columns.endDate"),
			cell: ({ row }) => {
				const dataFim = row.getValue("dataFim") as string;
				return (
					<div className="text-sm">{dataFim ? formatDate(dataFim) : "-"}</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: t("conference.columns.status"),
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return (
					<Badge variant="outline" className={getStatusColor(status)}>
						{t(`conference.status.${status}`)}
					</Badge>
				);
			},
		},
	];

	// Colunas para mobile (ocultar algumas colunas)
	if (isMobile) {
		return [
			...baseColumns.slice(0, 3), // Data, Local e Responsável
			{
				accessorKey: "status",
				header: t("conference.columns.status"),
				cell: ({ row }) => {
					const status = row.getValue("status") as string;
					return (
						<Badge variant="outline" className={getStatusColor(status)}>
							{t(`conference.status.${status}`)}
						</Badge>
					);
				},
			},
			{
				id: "actions",
				header: t("conference.columns.actions"),
				cell: ({ row }) => {
					const conferencia = row.original;
					return (
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onView(conferencia)}
								className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<Eye className="h-4 w-4" />
								<span className="sr-only">{t("conference.actions.view")}</span>
							</Button>
							{conferencia.status !== "FINALIZADA" && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(conferencia)}
									className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">
										{t("conference.actions.delete")}
									</span>
								</Button>
							)}
						</div>
					);
				},
			},
		];
	}

	// Colunas completas para desktop
	return [
		...baseColumns,
		{
			id: "actions",
			header: t("conference.columns.actions"),
			cell: ({ row }) => {
				const conferencia = row.original;
				return (
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onView(conferencia)}
							className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<Eye className="h-4 w-4" />
							<span className="sr-only">{t("conference.actions.view")}</span>
						</Button>
						{conferencia.status !== "FINALIZADA" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onDelete(conferencia)}
								className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">
									{t("conference.actions.delete")}
								</span>
							</Button>
						)}
					</div>
				);
			},
		},
	];
}

export function useIsMobile() {
	// Hook simples para detectar mobile
	return window.innerWidth < 768;
}
