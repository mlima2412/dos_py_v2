import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { HoverActions } from "@/components/ui/HoverActions";
import { type HoverAction } from "@/hooks/useStandardActions";
import { useDeleteCategoriaProduto } from "@/hooks/useCategoriaProduto";
import { useToast } from "@/hooks/useToast";

type CategoriaProduto = {
	id?: number;
	descricao?: string;
};

export function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkIsMobile();
		window.addEventListener("resize", checkIsMobile);

		return () => window.removeEventListener("resize", checkIsMobile);
	}, []);

	return isMobile;
}

export function useResponsiveColumns(
	t: (key: string) => string,
	isMobile: boolean
): ColumnDef<CategoriaProduto>[] {
	const deleteCategoria = useDeleteCategoriaProduto();
	const toast = useToast();

	const handleDelete = (id: number) => {
		deleteCategoria.mutate(
			{ id },
			{
				onSuccess: () => {
					toast.success(t("productCategories.messages.deleteSuccess"));
				},
				onError: error => {
					console.error("Erro ao excluir categoria:", error);
					toast.error(t("productCategories.messages.deleteError"));
				},
			}
		);
	};

	if (isMobile) {
		return [
			{
				accessorKey: "descricao",
				header: t("productCategories.columns.name"),
				cell: ({ row }) => {
					const categoria = row.original;
					return (
						<div className="font-medium">{categoria.descricao || "-"}</div>
					);
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const categoria = row.original;

					if (!categoria.id) return null;

					const actions: HoverAction[] = [
						{
							type: "edit" as const,
							label: t("common.edit"),
							icon: <Edit className="h-4 w-4" />,
							href: `/produto/categorias/editar/${categoria.id}`,
						},
						{
							type: "custom" as const,
							label: t("common.delete"),
							icon: <Trash2 className="h-4 w-4" />,
							onClick: () => handleDelete(categoria.id!),
							variant: "destructive" as const,
						},
					];

					return <HoverActions actions={actions} />;
				},
			},
		];
	}

	return [
		{
			accessorKey: "descricao",
			header: t("productCategories.columns.name"),
			cell: ({ row }) => row.original.descricao || "-",
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const categoria = row.original;

				if (!categoria.id) return null;

				const actions: HoverAction[] = [
					{
						type: "edit" as const,
						label: t("common.edit"),
						icon: <Edit className="h-4 w-4" />,
						href: `/produto/categorias/editar/${categoria.id}`,
					},
					{
						type: "custom" as const,
						label: t("common.delete"),
						icon: <Trash2 className="h-4 w-4" />,
						onClick: () => handleDelete(categoria.id!),
						variant: "destructive" as const,
					},
				];

				return <HoverActions actions={actions} />;
			},
		},
	];
}
