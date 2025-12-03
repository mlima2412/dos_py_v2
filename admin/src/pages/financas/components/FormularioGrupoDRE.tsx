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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
	useGrupoDreControllerCreate,
	useGrupoDreControllerUpdate,
	grupoDreControllerFindAllQueryKey,
} from "@/api-client/hooks";
import { GrupoDRE, CreateGrupoDreDto, UpdateGrupoDreDto } from "@/api-client/types";

const grupoDreSchema = z.object({
	codigo: z.string().min(1, "Campo obrigatório"),
	nome: z.string().min(1, "Campo obrigatório"),
	tipo: z.enum(["RECEITA", "DEDUCAO", "CUSTO", "DESPESA"]),
	ordem: z.number().int().positive("Deve ser um número positivo"),
});

type GrupoDreFormData = z.infer<typeof grupoDreSchema>;

interface FormularioGrupoDREProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	grupo: GrupoDRE | null;
}

export function FormularioGrupoDRE({
	open,
	onOpenChange,
	grupo,
}: FormularioGrupoDREProps) {
	const { t } = useTranslation("common");
	const queryClient = useQueryClient();
	const isEditing = !!grupo;

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<GrupoDreFormData>({
		resolver: zodResolver(grupoDreSchema),
		defaultValues: {
			codigo: "",
			nome: "",
			tipo: "DESPESA",
			ordem: 1,
		},
	});

	// Fill form when editing
	useEffect(() => {
		if (grupo) {
			reset({
				codigo: grupo.codigo,
				nome: grupo.nome,
				tipo: grupo.tipo,
				ordem: grupo.ordem,
			});
		} else {
			reset({
				codigo: "",
				nome: "",
				tipo: "DESPESA",
				ordem: 1,
			});
		}
	}, [grupo, reset]);

	// Mutations
	const createMutation = useGrupoDreControllerCreate({
		mutation: {
			onSuccess: () => {
				toast.success(t("chartOfAccounts.messages.groupCreateSuccess"));
				queryClient.invalidateQueries({ queryKey: grupoDreControllerFindAllQueryKey() });
				onOpenChange(false);
				reset();
			},
			onError: () => {
				toast.error(t("chartOfAccounts.messages.groupCreateError"));
			},
		},
	});

	const updateMutation = useGrupoDreControllerUpdate({
		mutation: {
			onSuccess: () => {
				toast.success(t("chartOfAccounts.messages.groupUpdateSuccess"));
				queryClient.invalidateQueries({ queryKey: grupoDreControllerFindAllQueryKey() });
				onOpenChange(false);
			},
			onError: () => {
				toast.error(t("chartOfAccounts.messages.groupUpdateError"));
			},
		},
	});

	const onSubmit = async (data: GrupoDreFormData) => {
		if (isEditing && grupo) {
			await updateMutation.mutateAsync({
				id: grupo.id,
				data: data as UpdateGrupoDreDto,
			});
		} else {
			await createMutation.mutateAsync({
				data: data as CreateGrupoDreDto,
			});
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? t("chartOfAccounts.editGroup")
							: t("chartOfAccounts.newGroup")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="codigo">
								{t("chartOfAccounts.groupCode")} *
							</Label>
							<Input
								id="codigo"
								{...register("codigo")}
								placeholder="Ex: 5100"
								className={errors.codigo ? "border-red-500" : ""}
							/>
							{errors.codigo && (
								<p className="text-sm text-red-500">{errors.codigo.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="ordem">
								{t("chartOfAccounts.groupOrder")} *
							</Label>
							<Input
								id="ordem"
								type="number"
								{...register("ordem", { valueAsNumber: true })}
								className={errors.ordem ? "border-red-500" : ""}
							/>
							{errors.ordem && (
								<p className="text-sm text-red-500">{errors.ordem.message}</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="nome">{t("chartOfAccounts.groupName")} *</Label>
						<Input
							id="nome"
							{...register("nome")}
							placeholder="Ex: Despesas com Pessoal"
							className={errors.nome ? "border-red-500" : ""}
						/>
						{errors.nome && (
							<p className="text-sm text-red-500">{errors.nome.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="tipo">{t("chartOfAccounts.groupType")} *</Label>
						<Controller
							name="tipo"
							control={control}
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger id="tipo">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="RECEITA">
											{t("chartOfAccounts.groupTypes.RECEITA")}
										</SelectItem>
										<SelectItem value="DEDUCAO">
											{t("chartOfAccounts.groupTypes.DEDUCAO")}
										</SelectItem>
										<SelectItem value="CUSTO">
											{t("chartOfAccounts.groupTypes.CUSTO")}
										</SelectItem>
										<SelectItem value="DESPESA">
											{t("chartOfAccounts.groupTypes.DESPESA")}
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
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
