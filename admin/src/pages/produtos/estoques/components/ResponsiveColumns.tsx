import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { LocalEstoque } from "@/api-client/types";
import { useParceirosAll } from "@/hooks/useParceiros";

export function useResponsiveColumns(
	t: (key: string) => string,
	isMobile: boolean,
	onPrintTags?: (stockPublicId: string, nomeLocal: string) => void
): ColumnDef<LocalEstoque>[] {
	const { data: parceiros } = useParceirosAll();

	const columns: ColumnDef<LocalEstoque>[] = [
		{
			accessorKey: "nome",
			header: t("inventory.columns.name"),
			cell: ({ row }) => {
				return <div className="font-medium">{row.original.nome}</div>;
			},
		},
		{
			accessorKey: "descricao",
			header: t("inventory.columns.description"),
			cell: ({ row }) => {
				return (
					<div className="text-sm text-muted-foreground">
						{row.original.descricao}
					</div>
				);
			},
		},
		{
			accessorKey: "parceiroId",
			header: t("inventory.columns.partner"),
			cell: ({ row }) => {
				const parceiro = parceiros?.find(p => p.id === row.original.parceiroId);
				return (
					<div className="text-sm">
						{parceiro?.nome || `Parceiro ID: ${row.original.parceiroId}`}
					</div>
				);
			},
		},
	];

	// Adicionar coluna de ações apenas em desktop
	if (!isMobile) {
		columns.push({
			id: "actions",
			header: t("inventory.columns.actions"),
			cell: ({ row }) => {
				return (
					<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<Link to={`/estoques/${row.original.publicId}/visualizar`}>
							<Button variant="ghost" size="sm" className="h-8 px-2">
								<Eye className="h-4 w-4" />
								<span className="sr-only">{t("inventory.actions.view")}</span>
							</Button>
						</Link>
						<Link to={`/estoques/${row.original.publicId}/editar`}>
							<Button variant="ghost" size="sm" className="h-8 px-2">
								<Edit className="h-4 w-4" />
								<span className="sr-only">{t("inventory.actions.edit")}</span>
							</Button>
						</Link>
						{onPrintTags && (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2"
								onClick={() =>
									onPrintTags(row.original.publicId!, row.original.nome)
								}
							>
								<Tag className="h-4 w-4" />
								<span className="sr-only">
									{t("inventory.actions.printTags")}
								</span>
							</Button>
						)}
					</div>
				);
			},
		});
	}

	return columns;
}

export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkIsMobile();
		window.addEventListener("resize", checkIsMobile);

		return () => window.removeEventListener("resize", checkIsMobile);
	}, []);

	return isMobile;
}
