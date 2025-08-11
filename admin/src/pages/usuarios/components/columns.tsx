import { createColumnHelper } from "@tanstack/react-table";
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
import {
	useActivateUser,
	useDeactivateUser,
} from "../../../hooks/useUserMutations";
import { useToast } from "../../../hooks/useToast";
import { type UsuarioWithRelations } from "../../../hooks/useUsers";
import { HoverActions } from "@/components/ui/HoverActions";

const columnHelper = createColumnHelper<UsuarioWithRelations>();

export const createColumns = (
	t: (key: string) => string,
	activateUser: ReturnType<typeof useActivateUser>,
	deactivateUser: ReturnType<typeof useDeactivateUser>,
	toast: ReturnType<typeof useToast>
) => [
	columnHelper.accessor("nome", {
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className='h-auto p-0 font-semibold'
			>
				{t("users.name")}
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
			<div className='font-medium'>{row.getValue("nome")}</div>
		),
	}),
	columnHelper.accessor("email", {
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className='h-auto p-0 font-semibold'
			>
				{t("users.email")}
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
			<div className='text-muted-foreground'>{row.getValue("email")}</div>
		),
	}),
	columnHelper.accessor("telefone", {
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className='h-auto p-0 font-semibold'
			>
				{t("users.phone")}
				{column.getIsSorted() === "asc" ? (
					<ArrowUp className='ml-2 h-4 w-4' />
				) : column.getIsSorted() === "desc" ? (
					<ArrowDown className='ml-2 h-4 w-4' />
				) : (
					<ArrowUpDown className='ml-2 h-4 w-4' />
				)}
			</Button>
		),
		cell: ({ row }) => <div>{row.getValue("telefone") || "-"}</div>,
	}),

	columnHelper.accessor("ativo", {
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className='h-auto p-0 font-semibold'
			>
				{t("users.status.label")}
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
			const ativo = row.getValue("ativo") as boolean;
			return (
				<Badge variant={ativo ? "default" : "destructive"}>
					{ativo ? t("users.status.active") : t("users.status.inactive")}
				</Badge>
			);
		},
	}),
	columnHelper.display({
		id: "actions",
		header: "",
		cell: ({ row }) => {
			const user = row.original;

			const handleToggleStatus = () => {
				if (user.ativo) {
					deactivateUser.mutate(user.publicId, {
						onSuccess: () => {
							toast.success(t("users.messages.deactivateSuccess"));
						},
						onError: () => {
							toast.error(t("users.messages.deactivateError"));
						},
					});
				} else {
					activateUser.mutate(user.publicId, {
						onSuccess: () => {
							toast.success(t("users.messages.activateSuccess"));
						},
						onError: () => {
							toast.error(t("users.messages.activateError"));
						},
					});
				}
			};

			// Criar ações manualmente para evitar erro de hook
			const actions = [
				{
					type: "edit" as const,
					label: t("users.common.edit"),
					icon: <Edit className='h-4 w-4' />,
					href: `/usuarios/editar/${user.publicId}`,
				},
				{
					type: "toggle" as const,
					label: user.ativo
						? t("users.common.deactivate")
						: t("users.common.activate"),
					icon: user.ativo ? (
						<PowerOff className='h-4 w-4' />
					) : (
						<Power className='h-4 w-4' />
					),
					onClick: handleToggleStatus,
					variant: user.ativo ? "destructive" as const : "default" as const,
				},
			];

			return <HoverActions actions={actions} />;
		},
	}),
];
