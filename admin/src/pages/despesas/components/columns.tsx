import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Edit,
	Trash2,
	AlertTriangle,
} from "lucide-react";
import { type Despesa } from "../../../api-client/types/Despesa";
import { HoverActions } from "@/components/ui/HoverActions";
import { type HoverAction } from "@/hooks/useStandardActions";
import { AlertDialogWithIcon } from "@/components/ui/alert-dialog-with-icon";
// import { Link } from "react-router-dom";

const columnHelper = createColumnHelper<Despesa>();

// Função para formatar valor com moeda
const formatCurrency = (value: number, currencyCode: string = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
};

// Função para formatar data
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const createColumns = (
	t: (key: string) => string,
	onDelete?: (id: string) => void,
	isAdmin: boolean = false
) => {

	return [
		columnHelper.accessor("descricao", {
			header: ({ column }) => (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className='h-auto p-0 font-semibold'
				>
					{t("expenses.description")}
					{column.getIsSorted() === "asc" ? (
						<ArrowUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDown className='ml-2 h-4 w-4' />
					) : (
						<ArrowUpDown className='ml-2 h-4 w-4' />
					)}
				</Button>
			),
			cell: ({ row }) => (
				<div className='font-medium max-w-[200px] truncate'>
					{row.getValue("descricao")}
				</div>
			),
		}),
		columnHelper.accessor("dataDespesa", {
			header: ({ column }) => (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className='h-auto p-0 font-semibold'
				>
					{t("expenses.date")}
					{column.getIsSorted() === "asc" ? (
						<ArrowUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDown className='ml-2 h-4 w-4' />
					) : (
						<ArrowUpDown className='ml-2 h-4 w-4' />
					)}
				</Button>
			),
			cell: ({ row }) => (
				<div className='text-muted-foreground'>
					{formatDate(row.getValue("dataDespesa"))}
				</div>
			),
		}),
		columnHelper.accessor((row) => row.subCategoria?.descricao, {
			id: "subCategoria",
			header: ({ column }) => (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className='h-auto p-0 font-semibold'
				>
					{t("expenses.subcategory")}
					{column.getIsSorted() === "asc" ? (
						<ArrowUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDown className='ml-2 h-4 w-4' />
					) : (
						<ArrowUpDown className='ml-2 h-4 w-4' />
					)}
				</Button>
			),
			cell: ({ row }) => (
				<Badge variant="secondary">
					{row.original.subCategoria?.descricao || '-'}
				</Badge>
			),
		}),
		columnHelper.accessor("valor", {
			header: ({ column }) => (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className='h-auto p-0 font-semibold'
				>
					{t("expenses.value")}
					{column.getIsSorted() === "asc" ? (
						<ArrowUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDown className='ml-2 h-4 w-4' />
					) : (
						<ArrowUpDown className='ml-2 h-4 w-4' />
					)}
				</Button>
			),
			cell: ({ row }) => {
				// TODO: Usar a moeda do parceiro quando disponível
				const currencyCode = 'BRL'; // row.original.parceiro?.moedaPrincipal || 'BRL';
				return (
					<div className='font-medium text-right'>
						{formatCurrency(row.getValue("valor"), currencyCode)}
					</div>
				);
			},
		}),
		columnHelper.display({
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const actions: HoverAction[] = [
				{
					type: "edit" as const,
					label: t("common.edit"),
					icon: <Edit className="h-4 w-4" />,
					href: `/despesas/editar/${row.original.publicId}`,
					variant: "ghost" as const,
				},
			];

			// Adicionar botão de deletar apenas para ADMIN
			if (isAdmin && onDelete) {
				actions.push({
					type: "custom" as const,
					label: t("common.delete"),
					icon: (
						<AlertDialogWithIcon
							trigger={
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							}
							icon={<AlertTriangle className="h-6 w-6" />}
							title={t("expenses.messages.deleteConfirmTitle")}
							description={t("expenses.messages.deleteConfirmDescription")}
							cancelText={t("expenses.messages.deleteConfirmCancel")}
							confirmText={t("expenses.messages.deleteConfirmConfirm")}
							onConfirm={() => onDelete(row.original.publicId)}
							variant="destructive"
						/>
					),
					variant: "ghost" as const,
				});
			}

			return (
				<HoverActions actions={actions} />
			);
			},
		}),
	];
};