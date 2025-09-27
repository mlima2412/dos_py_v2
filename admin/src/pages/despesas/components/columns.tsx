import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Trash2,
	AlertTriangle,
	Eye,
	CheckCircle,
} from "lucide-react";
import { type Despesa } from "../../../api-client/types/Despesa";
import { HoverActions } from "@/components/ui/HoverActions";
import { type HoverAction } from "@/hooks/useStandardActions";
import { AlertDialogWithIcon } from "@/components/ui/alert-dialog-with-icon";
// import { Link } from "react-router-dom";

// Tipo estendido para incluir campos calculados do backend
type DespesaExtended = Despesa & {
	statusPagamento?: "em_aberto" | "paga" | "parcialmente_paga";
	valorPago?: number;
	categoria?: {
		idCategoria: number;
		descricao: string;
	};
	currency?: {
		id: number;
		nome: string;
		isoCode: string;
		prefixo?: string;
	};
	ContasPagar?: {
		id: number;
		ContasPagarParcelas?: {
			id: number;
			publicId: string;
			pago: boolean;
		}[];
	}[];
};

const columnHelper = createColumnHelper<DespesaExtended>();

// Função para formatar valor com moeda
const formatCurrency = (value: number, currencyCode: string = "BRL") => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: currencyCode,
	}).format(value);
};

// Função para formatar data
const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("pt-BR");
};

// Função para obter badge do status de pagamento
const getStatusBadge = (status: string, t: (key: string) => string) => {
	const statusConfig = {
		em_aberto: {
			variant: "destructive" as const,
			label: t("expenses.status.pending"),
		},
		paga: { variant: "default" as const, label: t("expenses.status.paid") },
		parcialmente_paga: {
			variant: "secondary" as const,
			label: t("expenses.status.partiallyPaid"),
		},
	};

	const config =
		statusConfig[status as keyof typeof statusConfig] || statusConfig.em_aberto;
	return { variant: config.variant, label: config.label };
};

export const createColumns = (
	t: (key: string) => string,
	onDelete?: (id: string) => void,
	isAdmin: boolean = false,
	onMarkAsPaid?: (id: string) => void
) => {
	return [
		columnHelper.accessor("descricao", {
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-semibold"
				>
					{t("expenses.description")}
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
				<div className="font-medium max-w-[300px] truncate">
					{row.getValue("descricao")}
				</div>
			),
		}),
		columnHelper.accessor("dataRegistro", {
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-semibold"
				>
					{t("expenses.date")}
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
				<div className="text-muted-foreground">
					{formatDate(row.getValue("dataRegistro"))}
				</div>
			),
		}),
		columnHelper.accessor(row => row.fornecedor?.nome, {
			id: "fornecedor",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-semibold"
				>
					{t("expenses.supplier")}
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
				<div className="text-sm">{row.original.fornecedor?.nome || "-"}</div>
			),
		}),
		columnHelper.accessor(row => row.categoria?.descricao, {
			id: "categoria",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-semibold"
				>
					{t("expenses.category")}
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
				<Badge variant="outline">
					{row.original.categoria?.descricao || "-"}
				</Badge>
			),
		}),
		columnHelper.accessor(row => row.currency?.isoCode, {
			id: "currency",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-semibold"
				>
					{t("expenses.currency")}
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
				<Badge variant="secondary">{row.original.currency?.isoCode}</Badge>
			),
		}),
		columnHelper.accessor(row => row.statusPagamento, {
			id: "status",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-semibold"
				>
					{t("expenses.status.title")}
					{column.getIsSorted() === "asc" ? (
						<ArrowUp className="ml-2 h-4 w-4" />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDown className="ml-2 h-4 w-4" />
					) : (
						<ArrowUpDown className="ml-2 h-4 w-4" />
					)}
				</Button>
			),
			cell: ({ row }) => {
				const status = row.original.statusPagamento || "em_aberto";
				const { variant, label } = getStatusBadge(status, t);
				return <Badge variant={variant}>{label}</Badge>;
			},
		}),
		columnHelper.accessor(row => row.valorTotal, {
			id: "valorTotal",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-semibold"
				>
					{t("expenses.value")}
					{column.getIsSorted() === "asc" ? (
						<ArrowUp className="ml-2 h-4 w-4" />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDown className="ml-2 h-4 w-4" />
					) : (
						<ArrowUpDown className="ml-2 h-4 w-4" />
					)}
				</Button>
			),
			cell: ({ row }) => {
				const currencyCode = row.original.currency?.isoCode || "BRL";
				return (
					<div className="font-medium text-right">
						{formatCurrency(row.getValue("valorTotal"), currencyCode)}
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
						type: "custom" as const,
						label: t("common.view"),
						icon: <Eye className="h-4 w-4" />,
						href: `/despesas/visualizar/${row.original.publicId}`,
						variant: "ghost" as const,
					},
				];

				// Adicionar botão de marcar como paga apenas para despesas em aberto e com uma única parcela
				if (onMarkAsPaid && row.original.statusPagamento === "em_aberto") {
					// Verificar se a despesa tem apenas uma parcela
					const contasPagar = row.original.ContasPagar;
					const hasMultipleParcelas =
						contasPagar &&
						contasPagar.length > 0 &&
						contasPagar[0].ContasPagarParcelas &&
						contasPagar[0].ContasPagarParcelas.length > 1;

					// Só mostrar o botão se não tiver múltiplas parcelas
					if (!hasMultipleParcelas) {
						actions.push({
							type: "custom" as const,
							label: t("expenses.markAsPaid"),
							icon: <CheckCircle className="h-4 w-4 text-green-600" />,
							onClick: () => onMarkAsPaid(row.original.publicId),
							variant: "ghost" as const,
						});
					}
				}

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

				return <HoverActions actions={actions} />;
			},
		}),
	];
};
