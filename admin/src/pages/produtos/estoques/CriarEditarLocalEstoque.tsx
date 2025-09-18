import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Save, X, Loader2 } from "lucide-react";

import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useParceirosAll } from "@/hooks/useParceiros";
import {
	useCreateLocalEstoque,
	useUpdateLocalEstoque,
} from "@/hooks/useEstoques";
import { useLocalEstoqueControllerFindOne } from "@/api-client";
import { useToast } from "@/hooks/useToast";

// Schema de validação
const createLocalEstoqueSchema = z.object({
	nome: z
		.string()
		.min(2, "inventory.validations.nameMinLength")
		.max(255, "inventory.validations.nameMaxLength"),
	descricao: z.string().max(500, "inventory.validations.descriptionMaxLength"),
	parceiroId: z.number({
		message: "inventory.validations.partnerRequired",
	}),
	endereco: z
		.string()
		.min(5, "inventory.validations.addressMinLength")
		.max(500, "inventory.validations.addressMaxLength"),
});

type CreateLocalEstoqueFormData = z.infer<typeof createLocalEstoqueSchema>;

interface CriarEditarLocalEstoqueProps {
	mode: "create" | "edit" | "view";
}

export const CriarEditarLocalEstoque: React.FC<
	CriarEditarLocalEstoqueProps
> = ({ mode }) => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { id: publicId } = useParams();
	const toast = useToast();

	const isCreate = mode === "create";
	const isView = mode === "view";
	const isEdit = mode === "edit";

	// Hooks para dados
	const { data: parceiros } = useParceirosAll();
	const createMutation = useCreateLocalEstoque();
	const updateMutation = useUpdateLocalEstoque();

	// Buscar dados do local se estiver editando/visualizando
	const { data: localData, isLoading: isLoadingLocal } =
		useLocalEstoqueControllerFindOne(publicId || "", {
			query: {
				enabled: !isCreate && !!publicId,
			},
		});

	// Formulário
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CreateLocalEstoqueFormData>({
		resolver: zodResolver(createLocalEstoqueSchema),
		defaultValues: {
			nome: "",
			descricao: "",
			parceiroId: undefined,
			endereco: "",
		},
	});

	// Carregar dados quando o local for carregado
	useEffect(() => {
		if (localData && !isCreate) {
			reset({
				nome: localData.nome || "",
				descricao: localData.descricao || "",
				parceiroId: localData.parceiroId,
				endereco: localData.endereco || "",
			});
		}
	}, [localData, reset, isCreate]);

	// Options for selects - seguindo o padrão do cliente
	const parceiroOptions =
		parceiros
			?.filter(parceiro => parceiro.id)
			.map(parceiro => ({
				value: parceiro.id!.toString(),
				label: parceiro.nome,
			})) || [];

	// Função para submeter o formulário
	const onSubmit = async (data: CreateLocalEstoqueFormData) => {
		try {
			if (isCreate) {
				await createMutation.mutateAsync({ data });
				toast.success(t("inventory.messages.createSuccess"));
				navigate("/estoques");
			} else if (isEdit && publicId) {
				await updateMutation.mutateAsync({
					publicId: publicId,
					data,
				});
				toast.success(t("inventory.messages.updateSuccess"));
				navigate("/estoques");
			}
		} catch (error) {
			console.error("Erro ao salvar local de estoque:", error);
			toast.error(
				isCreate
					? t("inventory.messages.createError")
					: t("inventory.messages.updateError")
			);
		}
	};

	// Função para cancelar
	const handleCancel = () => {
		navigate("/estoques");
	};

	// Título da página
	const getPageTitle = () => {
		switch (mode) {
			case "create":
				return t("inventory.actions.create");
			case "edit":
				return t("inventory.edit");
			case "view":
				return t("inventory.view");
			default:
				return t("inventory.actions.create");
		}
	};

	// Mostrar loading se estiver carregando dados
	if (isLoadingLocal && !isCreate) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="flex items-center gap-2">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span>{t("common.loading")}</span>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/inicio">
								{t("navigation.home")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/estoques">
								{t("menu.inventory")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Formulário */}
				<Card>
					<CardContent className="pt-6">
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							{/* Linha 1: Nome e Descrição */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Nome */}
								<div className="space-y-2">
									<Label htmlFor="nome">{t("inventory.labels.name")} *</Label>
									<Input
										id="nome"
										placeholder={t("inventory.placeholders.name")}
										disabled={isView || isSubmitting}
										{...register("nome")}
									/>
									{errors.nome && (
										<p className="text-sm text-destructive">
											{t(errors.nome.message || "")}
										</p>
									)}
								</div>

								{/* Descrição */}
								<div className="space-y-2">
									<Label htmlFor="descricao">
										{t("inventory.labels.description")}
									</Label>
									<Textarea
										id="descricao"
										placeholder={t("inventory.placeholders.description")}
										disabled={isView || isSubmitting}
										rows={3}
										{...register("descricao")}
									/>
									{errors.descricao && (
										<p className="text-sm text-destructive">
											{t(errors.descricao.message || "")}
										</p>
									)}
								</div>
							</div>

							{/* Linha 2: Parceiro e Endereço */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Parceiro */}
								<div className="space-y-2">
									<Label htmlFor="parceiroId">
										{t("inventory.labels.partner")} *
									</Label>
									{parceiroOptions.length > 0 ? (
										<Select
											value={watch("parceiroId")?.toString() || ""}
											onValueChange={value => {
												if (value && value !== "") {
													setValue("parceiroId", parseInt(value));
												}
											}}
											disabled={isView || isSubmitting}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={t("inventory.placeholders.partner")}
												/>
											</SelectTrigger>
											<SelectContent>
												{parceiroOptions.map(option => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<div className="text-sm text-muted-foreground">
											Carregando parceiros...
										</div>
									)}
									{errors.parceiroId && (
										<p className="text-sm text-destructive">
											{t(errors.parceiroId.message || "")}
										</p>
									)}
								</div>

								{/* Endereço */}
								<div className="space-y-2">
									<Label htmlFor="endereco">
										{t("inventory.labels.address")} *
									</Label>
									<Input
										id="endereco"
										placeholder={t("inventory.placeholders.address")}
										disabled={isView || isSubmitting}
										{...register("endereco")}
									/>
									{errors.endereco && (
										<p className="text-sm text-destructive">
											{t(errors.endereco.message || "")}
										</p>
									)}
								</div>
							</div>

							{/* Ações */}
							{!isView && (
								<div className="flex justify-end gap-2 pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={handleCancel}
										disabled={isSubmitting || isLoadingLocal}
									>
										<X className="mr-2 h-4 w-4" />
										{t("inventory.actions.cancel")}
									</Button>
									<Button
										type="submit"
										disabled={isSubmitting || isLoadingLocal}
									>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												{t("common.updating")}
											</>
										) : (
											<>
												<Save className="mr-2 h-4 w-4" />
												{isCreate
													? t("inventory.actions.save")
													: t("inventory.actions.update")}
											</>
										)}
									</Button>
								</div>
							)}
						</form>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};
