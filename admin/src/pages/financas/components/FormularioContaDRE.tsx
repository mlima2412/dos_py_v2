import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";
import {
	useContaDreControllerCreate,
	useContaDreControllerUpdate,
	contaDreControllerFindAllQueryKey,
} from "@/api-client/hooks";
import { usePartner } from "@/hooks/usePartner";
import { ContaDRE, CreateContaDreDto, UpdateContaDreDto } from "@/api-client/types";

const contaDreSchema = z.object({
	nome: z.string().min(1, "Campo obrigatório"),
	codigo: z.string().optional(),
	ordem: z.number().int().positive("Deve ser um número positivo"),
});

type ContaDreFormData = z.infer<typeof contaDreSchema>;

interface FormularioContaDREProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	grupoId: number | null;
	conta: ContaDRE | null;
}

export function FormularioContaDRE({
	open,
	onOpenChange,
	grupoId,
	conta,
}: FormularioContaDREProps) {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartner();
	const queryClient = useQueryClient();
	const isEditing = !!conta;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ContaDreFormData>({
		resolver: zodResolver(contaDreSchema),
		defaultValues: {
			nome: "",
			codigo: "",
			ordem: 1,
		},
	});

	// Fill form when editing
	useEffect(() => {
		if (conta) {
			reset({
				nome: conta.nome,
				codigo: conta.codigo || "",
				ordem: conta.ordem,
			});
		} else {
			reset({
				nome: "",
				codigo: "",
				ordem: 1,
			});
		}
	}, [conta, reset]);

	// Mutations
	const createMutation = useContaDreControllerCreate({
		mutation: {
			onSuccess: () => {
				toast.success(t("chartOfAccounts.messages.createSuccess"));
				queryClient.invalidateQueries({ queryKey: contaDreControllerFindAllQueryKey() });
				onOpenChange(false);
				reset();
			},
			onError: () => {
				toast.error(t("chartOfAccounts.messages.createError"));
			},
		},
	});

	const updateMutation = useContaDreControllerUpdate({
		mutation: {
			onSuccess: () => {
				toast.success(t("chartOfAccounts.messages.updateSuccess"));
				queryClient.invalidateQueries({ queryKey: contaDreControllerFindAllQueryKey() });
				onOpenChange(false);
			},
			onError: () => {
				toast.error(t("chartOfAccounts.messages.updateError"));
			},
		},
	});

	const onSubmit = async (data: ContaDreFormData) => {
		if (!grupoId) return;

		if (isEditing && conta) {
			await updateMutation.mutateAsync({
				id: conta.id,
				data: {
					nome: data.nome,
					codigo: data.codigo || undefined,
					ordem: data.ordem,
				} as UpdateContaDreDto,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
			});
		} else {
			await createMutation.mutateAsync({
				data: {
					grupoId,
					nome: data.nome,
					codigo: data.codigo || undefined,
					ordem: data.ordem,
				} as CreateContaDreDto,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
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
							? t("chartOfAccounts.editAccount")
							: t("chartOfAccounts.newAccount")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="nome">{t("chartOfAccounts.accountName")} *</Label>
						<Input
							id="nome"
							{...register("nome")}
							placeholder="Ex: Salários"
							className={errors.nome ? "border-red-500" : ""}
						/>
						{errors.nome && (
							<p className="text-sm text-red-500">{errors.nome.message}</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="codigo">{t("chartOfAccounts.accountCode")}</Label>
							<Input
								id="codigo"
								{...register("codigo")}
								placeholder="Ex: 5100.01"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ordem">
								{t("chartOfAccounts.accountOrder")} *
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
