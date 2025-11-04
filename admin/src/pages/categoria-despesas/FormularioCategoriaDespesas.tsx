import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Spinner } from "@/components/ui/spinner";
import {
	useCategoriaDespesasControllerCreate,
	useCategoriaDespesasControllerUpdate,
	useCategoriaDespesasControllerFindOne,
} from "@/api-client";
import { useToast } from "@/hooks/useToast";

const FormularioCategoriaDespesas: React.FC = () => {
	const navigate = useNavigate();
	const { idCategoria } = useParams<{ idCategoria: string }>();
	const { t } = useTranslation();

	// Schema de validação
	const categoriaDespesaSchema = z.object({
		descricao: z
			.string()
			.min(1, t("expenseTypes.descriptionRequired"))
			.min(3, t("expenseTypes.descriptionMinLength"))
			.max(100, t("expenseTypes.descriptionMaxLength")),
	});

	type FormData = z.infer<typeof categoriaDespesaSchema>;
	const toast = useToast();

	const isEditing = Boolean(idCategoria);

	// Hooks de API
	const {
		data: categoria,
		isLoading: isLoadingCategoria,
		error: errorCategoria,
	} = useCategoriaDespesasControllerFindOne(Number(idCategoria), {
		query: {
			enabled: !!idCategoria && !isNaN(Number(idCategoria)),
		},
	});

	const createMutation = useCategoriaDespesasControllerCreate();
	const updateMutation = useCategoriaDespesasControllerUpdate();

	// Configuração do formulário
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<FormData>({
		resolver: zodResolver(categoriaDespesaSchema),
		defaultValues: {
			descricao: "",
		},
	});

	// Preencher formulário quando carregando dados para edição
	React.useEffect(() => {
		if (categoria && isEditing) {
			reset({
				descricao: categoria.descricao || "",
			});
		}
	}, [categoria, isEditing, reset]);

	// Função de submit
	const onSubmit = (data: FormData) => {
		if (isEditing && idCategoria) {
			updateMutation.mutate(
				{
					id: Number(idCategoria),
					data: {
						descricao: data.descricao,
						ativo: categoria?.ativo ?? true,
					},
				},
				{
					onSuccess: () => {
						toast.success("Categoria atualizada com sucesso!");
						navigate("/tipos-despesa");
					},
					onError: error => {
						console.error("Erro ao atualizar categoria:", error);
						toast.error("Erro ao atualizar categoria");
					},
				}
			);
		} else {
			createMutation.mutate(
				{
					data: {
						descricao: data.descricao,
						ativo: true,
					},
				},
				{
					onSuccess: () => {
						toast.success("Categoria criada com sucesso!");
						navigate("/tipos-despesa");
					},
					onError: error => {
						console.error("Erro ao criar categoria:", error);
						toast.error("Erro ao criar categoria");
					},
				}
			);
		}
	};

	const isLoading = isLoadingCategoria;
	const isSaving = createMutation.isPending || updateMutation.isPending;

	if (isLoading) {
		return (
			
				<div className="flex items-center justify-center min-h-[400px]">
					<Spinner size="lg" />
				</div>
			
		);
	}

	if (isEditing && errorCategoria) {
		return (
			
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center">
						<p className="text-destructive mb-4">Erro ao carregar categoria</p>
						<Button onClick={() => navigate("/tipos-despesa")}>
							Voltar para lista
						</Button>
					</div>
				</div>
			
		);
	}

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">{t("navigation.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/tipos-despesa">
								{t("administration.expenseTypes")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{isEditing ? "Editar Categoria" : "Nova Categoria"}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Formulário */}
				<Card>
					<CardHeader>
						<CardTitle>
							{isEditing
								? t("expenseTypes.editCategory")
								: t("expenseTypes.newCategory")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							{/* Campo Descrição */}
							<div className="space-y-2">
								<Label htmlFor="descricao">
									{t("expenseTypes.description")} *
								</Label>
								<Input
									id="descricao"
									{...register("descricao")}
									placeholder={t("expenseTypes.descriptionPlaceholder")}
									disabled={isSaving}
								/>
								{errors.descricao && (
									<p className="text-sm text-destructive">
										{errors.descricao.message}
									</p>
								)}
							</div>

							{/* Botões */}
							<div className="flex justify-end space-x-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => navigate("/tipos-despesa")}
									disabled={isSaving}
								>
									<X className="mr-2 h-4 w-4" />
									{t("common.cancel")}
								</Button>
								<Button type="submit" disabled={isSaving}>
									{isSaving ? (
										<Spinner size="sm" className="mr-2" />
									) : (
										<Save className="mr-2 h-4 w-4" />
									)}
									{isEditing ? t("common.update") : t("common.create")}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		
	);
};

export default FormularioCategoriaDespesas;
