import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import {
	useRegraLancamentoControllerCreate,
	useRegraLancamentoControllerUpdate,
	useContaDreControllerFindAll,
	useImpostoControllerFindAll,
	regraLancamentoControllerFindAllQueryKey,
} from "@/api-client/hooks";
import { usePartner } from "@/hooks/usePartner";
import {
	RegraLancamentoAutomatico,
	CreateRegraLancamentoDto,
	UpdateRegraLancamentoDto,
} from "@/api-client/types";

const regraSchema = z.object({
	nome: z.string().min(1, "Campo obrigatório"),
	tipoGatilho: z.enum(["VENDA_CONFIRMADA", "VENDA_COM_FATURA"]),
	contaDreId: z.number({ message: "Campo obrigatório" }),
	tipoVenda: z.enum(["DIRETA", "CONDICIONAL", "BRINDE", "PERMUTA"]).optional().nullable(),
	campoOrigem: z.enum(["valorTotal", "valorFrete", "valorComissao"]).optional().nullable(),
	impostoId: z.number().optional().nullable(),
	percentual: z.number().min(0).max(100).optional().nullable(),
	ativo: z.boolean(),
});

type RegraFormData = z.infer<typeof regraSchema>;

interface FormularioRegraLancamentoProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	regra: RegraLancamentoAutomatico | null;
}

export function FormularioRegraLancamento({
	open,
	onOpenChange,
	regra,
}: FormularioRegraLancamentoProps) {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartner();
	const queryClient = useQueryClient();
	const isEditing = !!regra;

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<RegraFormData>({
		resolver: zodResolver(regraSchema),
		defaultValues: {
			nome: "",
			tipoGatilho: "VENDA_CONFIRMADA",
			contaDreId: undefined,
			tipoVenda: null,
			campoOrigem: null,
			impostoId: null,
			percentual: null,
			ativo: true,
		},
	});

	// Query for contas DRE
	const { data: contas } = useContaDreControllerFindAll(
		{ "x-parceiro-id": Number(selectedPartnerId) },
		{
			query: {
				enabled: !!selectedPartnerId && open,
			},
		}
	);

	// Query for impostos
	const { data: impostos } = useImpostoControllerFindAll(
		{ "x-parceiro-id": Number(selectedPartnerId) },
		{
			query: {
				enabled: !!selectedPartnerId && open,
			},
		}
	);

	// Fill form when editing
	useEffect(() => {
		if (regra) {
			reset({
				nome: regra.nome,
				tipoGatilho: regra.tipoGatilho as "VENDA_CONFIRMADA" | "VENDA_COM_FATURA",
				contaDreId: regra.contaDreId,
				tipoVenda: (regra.tipoVenda as RegraFormData["tipoVenda"]) || null,
				campoOrigem: (regra.campoOrigem as RegraFormData["campoOrigem"]) || null,
				impostoId: regra.impostoId || null,
				percentual: regra.percentual ? Number(regra.percentual) : null,
				ativo: regra.ativo,
			});
		} else {
			reset({
				nome: "",
				tipoGatilho: "VENDA_CONFIRMADA",
				contaDreId: undefined,
				tipoVenda: null,
				campoOrigem: null,
				impostoId: null,
				percentual: null,
				ativo: true,
			});
		}
	}, [regra, reset]);

	// Mutations
	const createMutation = useRegraLancamentoControllerCreate({
		mutation: {
			onSuccess: () => {
				toast.success(t("autoRules.messages.createSuccess"));
				queryClient.invalidateQueries({ queryKey: regraLancamentoControllerFindAllQueryKey() });
				onOpenChange(false);
				reset();
			},
			onError: () => {
				toast.error(t("autoRules.messages.createError"));
			},
		},
	});

	const updateMutation = useRegraLancamentoControllerUpdate({
		mutation: {
			onSuccess: () => {
				toast.success(t("autoRules.messages.updateSuccess"));
				queryClient.invalidateQueries({ queryKey: regraLancamentoControllerFindAllQueryKey() });
				onOpenChange(false);
			},
			onError: () => {
				toast.error(t("autoRules.messages.updateError"));
			},
		},
	});

	const onSubmit = async (data: RegraFormData) => {
		const payload = {
			nome: data.nome,
			tipoGatilho: data.tipoGatilho,
			contaDreId: data.contaDreId,
			tipoVenda: data.tipoVenda || undefined,
			campoOrigem: data.campoOrigem || undefined,
			impostoId: data.impostoId || undefined,
			percentual: data.percentual || undefined,
			ativo: data.ativo,
		};

		if (isEditing && regra) {
			await updateMutation.mutateAsync({
				id: regra.id,
				data: payload as UpdateRegraLancamentoDto,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
			});
		} else {
			await createMutation.mutateAsync({
				data: payload as CreateRegraLancamentoDto,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
			});
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? t("autoRules.editRule") : t("autoRules.newRule")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="nome">{t("autoRules.ruleName")} *</Label>
						<Input
							id="nome"
							{...register("nome")}
							placeholder="Ex: Receita de Vendas Diretas"
							className={errors.nome ? "border-red-500" : ""}
						/>
						{errors.nome && (
							<p className="text-sm text-red-500">{errors.nome.message}</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="tipoGatilho">{t("autoRules.triggerType")} *</Label>
							<Controller
								name="tipoGatilho"
								control={control}
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger id="tipoGatilho">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="VENDA_CONFIRMADA">
												{t("autoRules.triggers.VENDA_CONFIRMADA")}
											</SelectItem>
											<SelectItem value="VENDA_COM_FATURA">
												{t("autoRules.triggers.VENDA_COM_FATURA")}
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="tipoVenda">{t("autoRules.saleType")}</Label>
							<Controller
								name="tipoVenda"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={v => field.onChange(v === "all" ? null : v)}
										value={field.value || "all"}
									>
										<SelectTrigger id="tipoVenda">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{t("autoRules.allSaleTypes")}
											</SelectItem>
											<SelectItem value="DIRETA">
												{t("autoRules.saleTypes.DIRETA")}
											</SelectItem>
											<SelectItem value="CONDICIONAL">
												{t("autoRules.saleTypes.CONDICIONAL")}
											</SelectItem>
											<SelectItem value="BRINDE">
												{t("autoRules.saleTypes.BRINDE")}
											</SelectItem>
											<SelectItem value="PERMUTA">
												{t("autoRules.saleTypes.PERMUTA")}
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="contaDreId">{t("autoRules.account")} *</Label>
						<Controller
							name="contaDreId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={
										contas?.map(conta => ({
											value: conta.id.toString(),
											label: conta.nome,
										})) || []
									}
									value={field.value?.toString() || ""}
									onValueChange={v => field.onChange(v ? Number(v) : undefined)}
									placeholder={t("autoRules.account")}
									searchPlaceholder={t("common.search")}
									emptyText={t("common.noResults")}
									className={errors.contaDreId ? "border-red-500" : ""}
								/>
							)}
						/>
						{errors.contaDreId && (
							<p className="text-sm text-red-500">{errors.contaDreId.message}</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="campoOrigem">{t("autoRules.sourceField")}</Label>
							<Controller
								name="campoOrigem"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={v => field.onChange(v === "none" ? null : v)}
										value={field.value || "none"}
									>
										<SelectTrigger id="campoOrigem">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">-</SelectItem>
											<SelectItem value="valorTotal">
												{t("autoRules.sourceFields.valorTotal")}
											</SelectItem>
											<SelectItem value="valorFrete">
												{t("autoRules.sourceFields.valorFrete")}
											</SelectItem>
											<SelectItem value="valorComissao">
												{t("autoRules.sourceFields.valorComissao")}
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="impostoId">{t("autoRules.tax")}</Label>
							<Controller
								name="impostoId"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={v =>
											field.onChange(v === "none" ? null : Number(v))
										}
										value={field.value?.toString() || "none"}
									>
										<SelectTrigger id="impostoId">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">-</SelectItem>
											{impostos?.map(imposto => (
												<SelectItem
													key={imposto.id}
													value={imposto.id.toString()}
												>
													{imposto.nome} ({String(imposto.percentual)}%)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="percentual">{t("autoRules.percentage")}</Label>
							<Input
								id="percentual"
								type="number"
								step="0.01"
								min="0"
								max="100"
								{...register("percentual", {
									setValueAs: v => (v === "" ? null : Number(v)),
								})}
								placeholder="Ex: 10.5"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="ativo">{t("autoRules.active")}</Label>
							<div className="flex items-center h-10">
								<Controller
									name="ativo"
									control={control}
									render={({ field }) => (
										<Switch
											id="ativo"
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									)}
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting || isPending}>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("common.save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
