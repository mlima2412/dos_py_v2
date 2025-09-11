import { ColumnDef } from "@tanstack/react-table";
import { type Cliente } from "@/api-client/index";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Edit, Power, PowerOff } from "lucide-react";
import { HoverActions } from "@/components/ui/HoverActions";
import { useActivateCliente, useDeactivateCliente } from "@/hooks/useClienteMutations";
import { useToast } from "@/hooks/useToast";
import { type HoverAction } from "@/hooks/useStandardActions";

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
): ColumnDef<Cliente>[] {
	const { i18n } = useTranslation();
	const locale = i18n.language === "es" ? es : ptBR;
	const activateCliente = useActivateCliente();
	const deactivateCliente = useDeactivateCliente();
	const toast = useToast();

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return "-";
		try {
			return format(new Date(dateString), "dd/MM/yyyy", { locale });
		} catch {
			return "-";
		}
	};

	if (isMobile) {
		return [
			{
				accessorKey: "nome",
				header: t("clients.name"),
				cell: ({ row }) => {
					const cliente = row.original;
					return (
						<div>
							<div className="font-medium">
								{cliente.nome} {cliente.sobrenome}
							</div>
							<div className="text-sm text-muted-foreground">
								{cliente.celular || "-"}
							</div>
							<div className="text-xs text-muted-foreground">
								{cliente.ultimaCompra
									? `Última compra: ${formatDate(cliente.ultimaCompra)}`
									: "Sem compras"}
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: "ativo",
				header: t("common.status"),
				cell: ({ row }) => {
					const ativo = row.original.ativo;
					return (
						<Badge variant={ativo ? "default" : "destructive"}>
							{ativo ? t("common.active") : t("common.inactive")}
						</Badge>
					);
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const cliente = row.original;

					const handleToggleStatus = () => {
						if (cliente.ativo) {
							deactivateCliente.mutate(
								{ publicId: cliente.publicId },
								{
									onSuccess: () => {
										toast.success(t("clients.messages.deactivateSuccess"));
									},
									onError: () => {
										toast.error(t("clients.messages.deactivateError"));
									},
								}
							);
						} else {
							activateCliente.mutate(
								{ publicId: cliente.publicId },
								{
									onSuccess: () => {
										toast.success(t("clients.messages.activateSuccess"));
									},
									onError: () => {
										toast.error(t("clients.messages.activateError"));
									},
								}
							);
						}
					};

					const actions: HoverAction[] = [
						{
							type: "edit" as const,
							label: t("common.edit"),
							icon: <Edit className="h-4 w-4" />,
							href: `/clientes/novo`,
						},
						{
							type: "toggle" as const,
							label: cliente.ativo
								? t("common.deactivate")
								: t("common.activate"),
							icon: cliente.ativo ? (
								<PowerOff className="h-4 w-4" />
							) : (
								<Power className="h-4 w-4" />
							),
							onClick: handleToggleStatus,
							variant: cliente.ativo ? ("destructive" as const) : ("default" as const),
						},
					];

					return <HoverActions actions={actions} />;
				},
			},
		];
	}

	return [
		{
			accessorKey: "nome",
			header: t("clients.columns.fullName"),
			cell: ({ row }) => `${row.original.nome} ${row.original.sobrenome || ""}`,
		},
		{
			accessorKey: "celular",
			header: t("clients.columns.cellphone"),
			cell: ({ row }) => row.original.celular || "-",
		},
		{
			accessorKey: "ultimaCompra",
			header: t("clients.columns.lastPurchase"),
			cell: ({ row }) => formatDate(row.original.ultimaCompra),
		},
		{
			accessorKey: "createdAt",
			header: t("clients.columns.registrationDate"),
			cell: ({ row }) => formatDate(row.original.createdAt),
		},
		{
			accessorKey: "redeSocial",
			header: t("clients.columns.socialMedia"),
			cell: ({ row }) => row.original.redeSocial || "-",
		},
		{
			accessorKey: "ativo",
			header: t("common.status"),
			cell: ({ row }) => {
				const ativo = row.original.ativo;
				return (
					<Badge variant={ativo ? "default" : "destructive"}>
						{ativo ? t("common.active") : t("common.inactive")}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const cliente = row.original;

				const handleToggleStatus = () => {
					if (cliente.ativo) {
						deactivateCliente.mutate(
							{ publicId: cliente.publicId },
							{
								onSuccess: () => {
									toast.success(t("clients.messages.deactivateSuccess"));
								},
								onError: () => {
									toast.error(t("clients.messages.deactivateError"));
								},
							}
						);
					} else {
						activateCliente.mutate(
							{ publicId: cliente.publicId },
							{
								onSuccess: () => {
									toast.success(t("clients.messages.activateSuccess"));
								},
								onError: () => {
									toast.error(t("clients.messages.activateError"));
								},
							}
						);
					}
				};

				const actions: HoverAction[] = [
					{
						type: "edit" as const,
						label: t("common.edit"),
						icon: <Edit className="h-4 w-4" />,
						href: `/clientes/novo`,
					},
					{
						type: "toggle" as const,
						label: cliente.ativo
							? t("common.deactivate")
							: t("common.activate"),
						icon: cliente.ativo ? (
							<PowerOff className="h-4 w-4" />
						) : (
							<Power className="h-4 w-4" />
						),
						onClick: handleToggleStatus,
						variant: cliente.ativo ? ("destructive" as const) : ("default" as const),
					},
				];

				return <HoverActions actions={actions} />;
			},
		},
	];
}
