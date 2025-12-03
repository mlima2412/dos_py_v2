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
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, Plus, Edit, Trash2, Settings2 } from "lucide-react";
import {
	useRegraLancamentoControllerFindAll,
	useRegraLancamentoControllerRemove,
	useRegraLancamentoControllerUpdate,
	regraLancamentoControllerFindAllQueryKey,
} from "@/api-client/hooks";
import { usePartner } from "@/hooks/usePartner";
import { RegraLancamentoAutomatico } from "@/api-client/types";
import { FormularioRegraLancamento } from "./components/FormularioRegraLancamento";

export function RegrasLancamento() {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartner();
	const queryClient = useQueryClient();

	// Dialog states
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingRegra, setEditingRegra] = useState<RegraLancamentoAutomatico | null>(null);

	// Query
	const { data: regras, isLoading } = useRegraLancamentoControllerFindAll(
		{ "x-parceiro-id": Number(selectedPartnerId) },
		{
			query: {
				enabled: !!selectedPartnerId,
			},
		}
	);

	// Mutations
	const deleteMutation = useRegraLancamentoControllerRemove({
		mutation: {
			onSuccess: () => {
				toast.success(t("autoRules.messages.deleteSuccess"));
				queryClient.invalidateQueries({ queryKey: regraLancamentoControllerFindAllQueryKey() });
			},
			onError: () => {
				toast.error(t("autoRules.messages.deleteError"));
			},
		},
	});

	const updateMutation = useRegraLancamentoControllerUpdate({
		mutation: {
			onSuccess: () => {
				toast.success(t("autoRules.messages.toggleSuccess"));
				queryClient.invalidateQueries({ queryKey: regraLancamentoControllerFindAllQueryKey() });
			},
			onError: () => {
				toast.error(t("autoRules.messages.toggleError"));
			},
		},
	});

	// Filter rules by trigger type
	const regrasPorTipo = useMemo(() => {
		if (!regras) return { VENDA_CONFIRMADA: [], VENDA_COM_FATURA: [] };
		return {
			VENDA_CONFIRMADA: regras.filter(r => r.tipoGatilho === "VENDA_CONFIRMADA"),
			VENDA_COM_FATURA: regras.filter(r => r.tipoGatilho === "VENDA_COM_FATURA"),
		};
	}, [regras]);

	// Handlers
	const handleNovaRegra = () => {
		setEditingRegra(null);
		setDialogOpen(true);
	};

	const handleEditRegra = (regra: RegraLancamentoAutomatico) => {
		setEditingRegra(regra);
		setDialogOpen(true);
	};

	const handleDeleteRegra = (regraId: number) => {
		deleteMutation.mutate({
			id: regraId,
			headers: { "x-parceiro-id": Number(selectedPartnerId) },
		});
	};

	const handleToggleAtivo = (regra: RegraLancamentoAutomatico) => {
		updateMutation.mutate({
			id: regra.id,
			data: { ativo: !regra.ativo },
			headers: { "x-parceiro-id": Number(selectedPartnerId) },
		});
	};

	const renderTable = (regrasList: RegraLancamentoAutomatico[]) => (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>{t("autoRules.ruleName")}</TableHead>
					<TableHead>{t("autoRules.saleType")}</TableHead>
					<TableHead>{t("autoRules.sourceField")}</TableHead>
					<TableHead>{t("autoRules.percentage")}</TableHead>
					<TableHead>{t("autoRules.active")}</TableHead>
					<TableHead className="w-[100px]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{regrasList.length === 0 ? (
					<TableRow>
						<TableCell colSpan={6} className="text-center text-muted-foreground py-8">
							{t("common.noResults")}
						</TableCell>
					</TableRow>
				) : (
					regrasList.map(regra => (
						<TableRow key={regra.id} className="group">
							<TableCell className="font-medium">{regra.nome}</TableCell>
							<TableCell>
								{regra.tipoVenda ? (
									<Badge variant="outline">
										{t(`autoRules.saleTypes.${regra.tipoVenda}`)}
									</Badge>
								) : (
									<span className="text-muted-foreground">
										{t("autoRules.allSaleTypes")}
									</span>
								)}
							</TableCell>
							<TableCell>
								{regra.campoOrigem ? (
									t(`autoRules.sourceFields.${regra.campoOrigem}`)
								) : (
									"-"
								)}
							</TableCell>
							<TableCell>
								{regra.percentual ? `${regra.percentual}%` : "-"}
							</TableCell>
							<TableCell>
								<Switch
									checked={regra.ativo}
									onCheckedChange={() => handleToggleAtivo(regra)}
								/>
							</TableCell>
							<TableCell>
								<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEditRegra(regra)}
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
													{t("common.delete")}
												</AlertDialogTitle>
												<AlertDialogDescription>
													{t("autoRules.messages.deleteSuccess")}
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => handleDeleteRegra(regra.id)}
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
	);

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
						<BreadcrumbPage>{t("autoRules.title")}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Settings2 className="h-5 w-5" />
							{t("autoRules.title")}
						</CardTitle>
						<Button onClick={handleNovaRegra} size="sm">
							<Plus className="h-4 w-4 mr-2" />
							{t("autoRules.newRule")}
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">
						{t("autoRules.description")}
					</p>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<Tabs defaultValue="VENDA_CONFIRMADA">
							<TabsList>
								<TabsTrigger value="VENDA_CONFIRMADA">
									{t("autoRules.triggers.VENDA_CONFIRMADA")}
									{regrasPorTipo.VENDA_CONFIRMADA.length > 0 && (
										<Badge variant="secondary" className="ml-2">
											{regrasPorTipo.VENDA_CONFIRMADA.length}
										</Badge>
									)}
								</TabsTrigger>
								<TabsTrigger value="VENDA_COM_FATURA">
									{t("autoRules.triggers.VENDA_COM_FATURA")}
									{regrasPorTipo.VENDA_COM_FATURA.length > 0 && (
										<Badge variant="secondary" className="ml-2">
											{regrasPorTipo.VENDA_COM_FATURA.length}
										</Badge>
									)}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="VENDA_CONFIRMADA" className="mt-4">
								{renderTable(regrasPorTipo.VENDA_CONFIRMADA)}
							</TabsContent>

							<TabsContent value="VENDA_COM_FATURA" className="mt-4">
								{renderTable(regrasPorTipo.VENDA_COM_FATURA)}
							</TabsContent>
						</Tabs>
					)}
				</CardContent>
			</Card>

			{/* Dialog for Regra */}
			<FormularioRegraLancamento
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				regra={editingRegra}
			/>
		</div>
	);
}

export default RegrasLancamento;
