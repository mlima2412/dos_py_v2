import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialogWithIcon } from "@/components/ui/alert-dialog-with-icon";
import { HoverActions } from "@/components/ui/HoverActions";
import { useToast } from "@/hooks/useToast";
import { useDespesasRecorrentesControllerRemove } from "@/api-client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { type HoverAction } from "@/hooks/useStandardActions";

import { usePartnerContext } from "@/hooks/usePartnerContext";
import { DespesaRecorrente } from "@/api-client/types";

// Hook para detectar dispositivos móveis
export const useIsMobile = () => {
	return useMemo(() => {
		return window.innerWidth < 768;
	}, []);
};

// Função para formatar moeda
const formatCurrency = (value: number, currencyCode: string = "BRL") => {
	try {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: currencyCode,
		}).format(value);
	} catch {
		return `${currencyCode} ${value.toFixed(2)}`;
	}
};

// Função para formatar frequência
const formatFrequency = (frequency: string, t: (key: string) => string) => {
	const frequencyMap: Record<string, string> = {
		SEMANAL: t("recurringExpenses.frequencyOptions.weekly"),
		QUINZENAL: t("recurringExpenses.frequencyOptions.biweekly"),
		MENSAL: t("recurringExpenses.frequencyOptions.monthly"),
		TRIMESTRAL: t("recurringExpenses.frequencyOptions.quarterly"),
		SEMESTRAL: t("recurringExpenses.frequencyOptions.semiannual"),
		ANUAL: t("recurringExpenses.frequencyOptions.yearly"),
	};
	return frequencyMap[frequency] || frequency;
};

// Função para obter badge de frequência
const getFrequencyBadge = (frequency: string, t: (key: string) => string) => {
	const colorMap: Record<string, string> = {
		SEMANAL: "bg-blue-100 text-blue-800",
		QUINZENAL: "bg-green-100 text-green-800",
		MENSAL: "bg-purple-100 text-purple-800",
		TRIMESTRAL: "bg-orange-100 text-orange-800",
		SEMESTRAL: "bg-red-100 text-red-800",
		ANUAL: "bg-gray-100 text-gray-800",
	};

	return (
		<Badge className={colorMap[frequency] || "bg-gray-100 text-gray-800"}>
			{formatFrequency(frequency, t)}
		</Badge>
	);
};

export const useRecurringExpensesColumns = (
	t: (key: string, options?: Record<string, unknown>) => string,
	isMobile: boolean
): ColumnDef<DespesaRecorrente>[] => {
	const toast = useToast();
	const queryClient = useQueryClient();

	const { selectedPartnerId } = usePartnerContext();

	const deleteMutation = useDespesasRecorrentesControllerRemove({
		mutation: {
			onSuccess: () => {
				toast.success(t("recurringExpenses.messages.deleteSuccess"));
				// Invalidar queries relacionadas
				queryClient.invalidateQueries({
					queryKey: [
						{
							url: "/despesas-recorrentes/parceiro/:parceiroId",
							params: { parceiroId: Number(selectedPartnerId) },
						},
					],
				});
			},
			onError: (error: unknown) => {
				toast.error(
					(error as Error)?.message ||
						t("recurringExpenses.messages.deleteError")
				);
			},
		},
	});

	const handleDelete = async (despesa: DespesaRecorrente) => {
		// Verificar se o usuário tem permissão para deletar
		if (despesa.parceiroId !== Number(selectedPartnerId)) {
			toast.error(t("common.accessDenied"));
			return;
		}

		try {
			await deleteMutation.mutateAsync({
				publicId: despesa.publicId,
			});
		} catch {
			// Erro já tratado no onError da mutation
		}
	};

	const allColumns: ColumnDef<DespesaRecorrente>[] = useMemo(
		() => [
			{
				accessorKey: "descricao",
				header: ({ column }) => (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="h-8 px-2 lg:px-3"
					>
						{t("recurringExpenses.description")}
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => {
					const despesa = row.original;
					return (
						<div className="flex flex-col">
							<span className="font-medium">{despesa.descricao}</span>
							{despesa.fornecedor && (
								<span className="text-sm text-muted-foreground">
									{despesa.fornecedor.nome}
								</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: "frequencia",
				header: ({ column }) => (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="h-8 px-2 lg:px-3"
					>
						{t("recurringExpenses.frequency")}
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => {
					return getFrequencyBadge(row.original.frequencia, t);
				},
			},
			{
				accessorKey: "valor",
				header: ({ column }) => (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="h-8 px-2 lg:px-3"
					>
						{t("recurringExpenses.amount")}
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => {
					const despesa = row.original;
					const currencyCode = "BRL"; // Usar Real brasileiro como padrão
					return (
						<span className="font-medium">
							{formatCurrency(despesa.valor, currencyCode)}
						</span>
					);
				},
			},
			{
				accessorKey: "diaVencimento",
				header: ({ column }) => (
					<div className="flex justify-center">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
							className="h-8 px-2 lg:px-3"
						>
							{t("recurringExpenses.dueDay")}
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				),
				cell: ({ row }) => {
					return (
						<div className="text-center">
							<span className="font-medium">{row.original.diaVencimento}</span>
						</div>
					);
				},
			},
			{
				accessorKey: "subCategoria",
				header: t("recurringExpenses.subcategory"),
				cell: ({ row }) => {
					return (
						<span className="text-sm">
							{row.original.subCategoria?.descricao || "-"}
						</span>
					);
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const despesa = row.original;

					const actions: HoverAction[] = [
						{
							type: "edit",
							label: t("recurringExpenses.actions.edit"),
							icon: <Edit className="h-4 w-4" />,
							href: `/despesas/recorrentes/editar/${despesa.publicId}`,
							variant: "ghost",
						},
						{
							type: "custom",
							label: t("recurringExpenses.actions.delete"),
							icon: (
								<AlertDialogWithIcon
									trigger={
										<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									}
									title={t("recurringExpenses.messages.deleteConfirmTitle")}
									description={t(
										"recurringExpenses.messages.deleteConfirmDescription"
									)}
									confirmText={t(
										"recurringExpenses.messages.deleteConfirmConfirm"
									)}
									cancelText={t(
										"recurringExpenses.messages.deleteConfirmCancel"
									)}
									onConfirm={() => handleDelete(despesa)}
									icon={<AlertTriangle className="h-6 w-6" />}
									variant="destructive"
								/>
							),
							variant: "ghost",
						},
					];

					return <HoverActions actions={actions} />;
				},
			},
		],
		[t, deleteMutation, selectedPartnerId, toast, queryClient]
	);

	// Filtrar colunas para dispositivos móveis
	const mobileColumns = useMemo(() => {
		return allColumns.filter(column => {
			const columnWithAccessor = column as ColumnDef<DespesaRecorrente> & {
				accessorKey?: string;
			};
			if (!columnWithAccessor.accessorKey && column.id !== "actions")
				return false;
			const essentialColumns = [
				"descricao",
				"frequencia",
				"valor",
				"diaVencimento",
			];
			return (
				essentialColumns.includes(columnWithAccessor.accessorKey as string) ||
				column.id === "actions"
			);
		});
	}, [allColumns]);

	return isMobile ? mobileColumns : allColumns;
};
