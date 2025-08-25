import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Save, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Spinner } from "@/components/ui/spinner";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCanal, useCreateCanal, useUpdateCanal } from "@/hooks/useCanais";
import type { CreateCanalOrigemDto, UpdateCanalOrigemDto } from "@/api-client";

const createCanalOrigemSchema = (t: (key: string) => string) =>
	z.object({
		nome: z.string().min(1, t("originChannels.form.name.required")),
		descricao: z.string().optional(),
		ativo: z.boolean(),
	});

// Tipo para o formulário que garante que ativo seja sempre boolean
type FormDataType = {
	nome: string;
	descricao?: string;
	ativo: boolean;
};

export function FormularioCanalOrigem() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { publicId } = useParams<{ publicId: string }>();
	const isEditing = !!publicId;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<FormDataType>({
		resolver: zodResolver(createCanalOrigemSchema(t)),
		defaultValues: {
			nome: "",
			descricao: "",
			ativo: true,
		},
	});

	// Hooks de mutação
	const createCanalOrigemMutation = useCreateCanal();
	const updateCanalOrigemMutation = useUpdateCanal();

	// Hook para buscar canal existente (apenas se editando)
	const { data: canalOrigem, isLoading: isLoadingCanalOrigem } = useCanal(
		publicId || ""
	);

	// Preencher formulário quando editando
	useEffect(() => {
		if (isEditing && canalOrigem) {
			reset({
				nome: canalOrigem.nome,
				descricao: canalOrigem.descricao || "",
				ativo: canalOrigem.ativo,
			});
		}
	}, [isEditing, canalOrigem, reset]);

	const onSubmit: SubmitHandler<FormDataType> = async (data: FormDataType) => {
		try {
			if (isEditing && publicId) {
				// Transformar dados para UpdateCanalOrigemDto
				const updateData: UpdateCanalOrigemDto = {
					nome: data.nome,
					descricao: data.descricao || undefined,
					ativo: data.ativo,
				};

				await updateCanalOrigemMutation.mutateAsync({
					publicId,
					data: updateData,
				});
			} else {
				// Transformar dados para CreateCanalOrigemDto
				const createData: CreateCanalOrigemDto = {
					nome: data.nome,
					descricao: data.descricao || undefined,
					ativo: data.ativo ?? true,
				};

				await createCanalOrigemMutation.mutateAsync({ data: createData });
			}
			// Redirecionar após sucesso

			navigate("/canais-origem");
		} catch {
			// Erro já é tratado pelos hooks de mutação
		}
	};

	const isLoading = isLoadingCanalOrigem;
	const isSaving =
		createCanalOrigemMutation.isPending || updateCanalOrigemMutation.isPending;

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center min-h-[400px]">
					<Spinner size="lg" />
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
							<BreadcrumbLink href="/">{t("navigation.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/canais-origem">
								{t("administration.originChannels")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{isEditing
									? t("originChannels.edit")
									: t("originChannels.create")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Formulário */}
				<Card>
					<CardHeader>
						<CardTitle>
							{isEditing
								? t("originChannels.edit")
								: t("originChannels.create")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Nome */}
								<div className="space-y-2">
									<Label htmlFor="nome">{t("originChannels.name")} *</Label>
									<Input
										id="nome"
										{...register("nome")}
										placeholder={t("originChannels.namePlaceholder")}
										className={errors.nome ? "border-destructive" : ""}
									/>
									{errors.nome && (
										<p className="text-sm text-destructive">
											{errors.nome.message}
										</p>
									)}
								</div>

								{/* Status Ativo */}
								{isEditing && (
									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="ativo"
											className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
											checked={watch("ativo")}
											onChange={e => setValue("ativo", e.target.checked)}
										/>
										<Label htmlFor="ativo">
											{t("originChannels.form.active.label")}
										</Label>
									</div>
								)}
							</div>

							{/* Descrição */}
							<div className="space-y-2">
								<Label htmlFor="descricao">
									{t("originChannels.form.description.label")}
								</Label>
								<textarea
									id="descricao"
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									placeholder={t("originChannels.form.description.placeholder")}
									{...register("descricao")}
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
									onClick={() => navigate("/canais-origem")}
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
		</DashboardLayout>
	);
}
