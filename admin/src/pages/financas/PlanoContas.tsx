import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit, Trash2, FolderTree } from "lucide-react";
import {
	useGrupoDreControllerFindAll,
	useGrupoDreControllerRemove,
	useContaDreControllerFindAll,
	useContaDreControllerRemove,
	useContaDreControllerUpdate,
	grupoDreControllerFindAllQueryKey,
	contaDreControllerFindAllQueryKey,
} from "@/api-client/hooks";

// Helper para extrair mensagem de erro do backend
function getErrorMessage(error: unknown, fallback: string): string {
	if (error && typeof error === "object") {
		const maybeError = error as {
			response?: { data?: { message?: string } };
			data?: { message?: string };
		};
		const message =
			maybeError.response?.data?.message || maybeError.data?.message;
		if (typeof message === "string") return message;
	}
	return fallback;
}
import { usePartner } from "@/hooks/usePartner";
import { GrupoDRE, ContaDRE } from "@/api-client/types";
import { FormularioGrupoDRE } from "./components/FormularioGrupoDRE";
import { FormularioContaDRE } from "./components/FormularioContaDRE";

function getBadgeVariant(tipo: string): "default" | "secondary" | "destructive" | "outline" {
	switch (tipo) {
		case "RECEITA":
			return "default";
		case "DEDUCAO":
			return "secondary";
		case "CUSTO":
			return "destructive";
		case "DESPESA":
			return "outline";
		default:
			return "default";
	}
}

export function PlanoContas() {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartner();
	const queryClient = useQueryClient();

	// Dialog states
	const [grupoDialogOpen, setGrupoDialogOpen] = useState(false);
	const [contaDialogOpen, setContaDialogOpen] = useState(false);
	const [editingGrupo, setEditingGrupo] = useState<GrupoDRE | null>(null);
	const [editingConta, setEditingConta] = useState<ContaDRE | null>(null);
	const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);

	// Queries
	const { data: grupos, isLoading: loadingGrupos } = useGrupoDreControllerFindAll({
		query: {
			enabled: true,
		},
	});

	const { data: contas, isLoading: loadingContas } = useContaDreControllerFindAll(
		{ "x-parceiro-id": Number(selectedPartnerId) },
		{
			query: {
				enabled: !!selectedPartnerId,
				// Query key customizada para evitar conflito de cache com outras páginas
				// que buscam apenas contas ativas
				queryKey: [{ url: '/conta-dre', params: { incluirInativos: true, parceiroId: selectedPartnerId } }],
			},
			client: {
				params: { incluirInativos: true },
			},
		}
	);

	// Mutations for delete
	const deleteGrupoMutation = useGrupoDreControllerRemove({
		mutation: {
			onSuccess: () => {
				toast.success(t("chartOfAccounts.messages.groupDeleteSuccess"));
				queryClient.invalidateQueries({ queryKey: grupoDreControllerFindAllQueryKey() });
			},
			onError: (error: unknown) => {
				const message = getErrorMessage(error, t("chartOfAccounts.messages.groupDeleteError"));
				toast.error(message);
			},
		},
	});

	const deleteContaMutation = useContaDreControllerRemove({
		mutation: {
			onSuccess: () => {
				toast.success(t("chartOfAccounts.messages.deleteSuccess"));
				queryClient.invalidateQueries({ queryKey: contaDreControllerFindAllQueryKey() });
			},
			onError: (error: unknown) => {
				const message = getErrorMessage(error, t("chartOfAccounts.messages.deleteError"));
				toast.error(message);
			},
		},
	});

	const updateContaMutation = useContaDreControllerUpdate({
		mutation: {
			onSuccess: () => {
				toast.success(t("chartOfAccounts.messages.toggleSuccess"));
				queryClient.invalidateQueries({ queryKey: contaDreControllerFindAllQueryKey() });
			},
			onError: (error: unknown) => {
				const message = getErrorMessage(error, t("chartOfAccounts.messages.toggleError"));
				toast.error(message);
			},
		},
	});

	// Group accounts by grupoId
	const contasPorGrupo = useMemo(() => {
		if (!contas) return {} as Record<number, ContaDRE[]>;
		return contas.reduce(
			(acc, conta) => {
				const grupoId = conta.grupoId;
				if (!acc[grupoId]) acc[grupoId] = [];
				acc[grupoId].push(conta);
				return acc;
			},
			{} as Record<number, ContaDRE[]>
		);
	}, [contas]);

	// Sort groups by ordem
	const gruposOrdenados = useMemo(() => {
		if (!grupos) return [];
		return [...grupos].sort((a, b) => a.ordem - b.ordem);
	}, [grupos]);

	// Handlers for Grupo
	const handleNovoGrupo = () => {
		setEditingGrupo(null);
		setGrupoDialogOpen(true);
	};

	const handleEditGrupo = (grupo: GrupoDRE) => {
		setEditingGrupo(grupo);
		setGrupoDialogOpen(true);
	};

	const handleDeleteGrupo = (grupoId: number) => {
		deleteGrupoMutation.mutate({ id: grupoId });
	};

	// Handlers for Conta
	const handleNovaConta = (grupoId: number) => {
		setSelectedGrupoId(grupoId);
		setEditingConta(null);
		setContaDialogOpen(true);
	};

	const handleEditConta = (conta: ContaDRE) => {
		setSelectedGrupoId(conta.grupoId);
		setEditingConta(conta);
		setContaDialogOpen(true);
	};

	const handleDeleteConta = (contaId: number) => {
		deleteContaMutation.mutate({
			id: contaId,
			headers: { "x-parceiro-id": Number(selectedPartnerId) },
		});
	};

	const handleToggleAtivoConta = (conta: ContaDRE) => {
		updateContaMutation.mutate({
			id: conta.id,
			data: { ativo: !conta.ativo },
			headers: { "x-parceiro-id": Number(selectedPartnerId) },
		});
	};

	const isLoading = loadingGrupos || loadingContas;

	return (
		<div className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="#">{t("menu.finances")}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{t("chartOfAccounts.title")}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<FolderTree className="h-5 w-5" />
							{t("chartOfAccounts.title")}
						</CardTitle>
						<Button onClick={handleNovoGrupo} size="sm">
							<Plus className="h-4 w-4 mr-2" />
							{t("chartOfAccounts.newGroup")}
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">
						{t("chartOfAccounts.description")}
					</p>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : gruposOrdenados.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<p>{t("chartOfAccounts.noAccounts")}</p>
						</div>
					) : (
						<Accordion type="multiple" className="space-y-2">
							{gruposOrdenados.map(grupo => (
								<AccordionItem
									key={grupo.id}
									value={grupo.codigo}
									className="border rounded-lg px-4"
								>
									<AccordionTrigger className="hover:no-underline py-3">
										<div className="flex items-center justify-between w-full pr-4">
											<div className="flex items-center gap-3">
												<Badge variant={getBadgeVariant(grupo.tipo)}>
													{t(`chartOfAccounts.groupTypes.${grupo.tipo}`)}
												</Badge>
												<span className="font-medium">
													{grupo.codigo} - {grupo.nome}
												</span>
												<span className="text-muted-foreground text-sm">
													({contasPorGrupo[grupo.id]?.length || 0}{" "}
													{contasPorGrupo[grupo.id]?.length === 1 ? "conta" : "contas"})
												</span>
											</div>
											<div
												className="flex gap-1"
												onClick={e => e.stopPropagation()}
											>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleEditGrupo(grupo)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button variant="ghost" size="sm">
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																{t("chartOfAccounts.deleteGroupConfirmTitle")}
															</AlertDialogTitle>
															<AlertDialogDescription>
																{t("chartOfAccounts.deleteGroupConfirmDescription")}
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDeleteGrupo(grupo.id)}
																className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
															>
																{t("common.delete")}
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</div>
									</AccordionTrigger>
									<AccordionContent className="pt-2 pb-4">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>{t("chartOfAccounts.accountName")}</TableHead>
													<TableHead>{t("chartOfAccounts.accountCode")}</TableHead>
													<TableHead>{t("chartOfAccounts.accountActive")}</TableHead>
													<TableHead className="w-[100px]" />
												</TableRow>
											</TableHeader>
											<TableBody>
												{!contasPorGrupo[grupo.id] ||
												contasPorGrupo[grupo.id].length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center text-muted-foreground py-4"
														>
															{t("chartOfAccounts.noAccounts")}
														</TableCell>
													</TableRow>
												) : (
													contasPorGrupo[grupo.id]
														.sort((a, b) => a.ordem - b.ordem)
														.map(conta => (
															<TableRow key={conta.id} className="group">
																<TableCell>{conta.nome}</TableCell>
																<TableCell>{conta.codigo || "-"}</TableCell>
																<TableCell>
																	<Switch
																		checked={conta.ativo}
																		onCheckedChange={() => handleToggleAtivoConta(conta)}
																	/>
																</TableCell>
																<TableCell>
																	<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																		<Button
																			variant="ghost"
																			size="sm"
																			onClick={() => handleEditConta(conta)}
																		>
																			<Edit className="h-4 w-4" />
																		</Button>
																		<AlertDialog>
																			<AlertDialogTrigger asChild>
																				<Button variant="ghost" size="sm">
																					<Trash2 className="h-4 w-4 text-destructive" />
																				</Button>
																			</AlertDialogTrigger>
																			<AlertDialogContent>
																				<AlertDialogHeader>
																					<AlertDialogTitle>
																						{t("chartOfAccounts.messages.deleteConfirmTitle")}
																					</AlertDialogTitle>
																					<AlertDialogDescription>
																						{t("chartOfAccounts.messages.deleteConfirmDescription")}
																					</AlertDialogDescription>
																				</AlertDialogHeader>
																				<AlertDialogFooter>
																					<AlertDialogCancel>
																						{t("common.cancel")}
																					</AlertDialogCancel>
																					<AlertDialogAction
																						onClick={() => handleDeleteConta(conta.id)}
																						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																					>
																						{t("common.delete")}
																					</AlertDialogAction>
																				</AlertDialogFooter>
																			</AlertDialogContent>
																		</AlertDialog>
																	</div>
																</TableCell>
															</TableRow>
														))
												)}
											</TableBody>
										</Table>
										<Button
											variant="outline"
											className="mt-4"
											size="sm"
											onClick={() => handleNovaConta(grupo.id)}
										>
											<Plus className="h-4 w-4 mr-2" />
											{t("chartOfAccounts.newAccount")}
										</Button>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					)}
				</CardContent>
			</Card>

			{/* Dialog for Grupo */}
			<FormularioGrupoDRE
				open={grupoDialogOpen}
				onOpenChange={setGrupoDialogOpen}
				grupo={editingGrupo}
			/>

			{/* Dialog for Conta */}
			<FormularioContaDRE
				open={contaDialogOpen}
				onOpenChange={setContaDialogOpen}
				grupoId={selectedGrupoId}
				conta={editingConta}
			/>
		</div>
	);
}

export default PlanoContas;
