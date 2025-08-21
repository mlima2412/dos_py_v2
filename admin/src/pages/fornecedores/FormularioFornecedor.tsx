import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from '@/hooks/useToast';
import { ResponseErrorConfig } from '@/lib/fetch-client';
import { usePartnerContext } from '@/hooks/usePartnerContext';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Spinner } from "@/components/ui/spinner";
import { Save, X } from "lucide-react";

import {
	useFornecedoresControllerFindOne,
	useFornecedoresControllerCreate,
	useFornecedoresControllerUpdate,
	type Fornecedor,
} from "@/api-client";

// Schema de validação com i18n
const createFornecedorSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
	z.object({
		nome: z
			.string()
			.min(1, t("validation.required", { field: t("suppliers.name") }))
			.min(
				2,
				t("validation.minLength", { field: t("suppliers.name"), min: 2 })
			),
		email: z.string().email(t("validation.email")).optional().or(z.literal("")),
		telefone: z.string().optional(),
		ruccnpj: z.string().optional(),
		redesocial: z.string().optional(),
	});

const updateFornecedorSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
	z.object({
		nome: z
			.string()
			.min(1, t("validation.required", { field: t("suppliers.name") }))
			.min(
				2,
				t("validation.minLength", { field: t("suppliers.name"), min: 2 })
			),
		email: z.string().email(t("validation.email")).optional().or(z.literal("")),
		telefone: z.string().optional(),
		ruccnpj: z.string().optional(),
		redesocial: z.string().optional(),
	});

type CreateFornecedorFormData = z.infer<
	ReturnType<typeof createFornecedorSchema>
>;
type UpdateFornecedorFormData = z.infer<
	ReturnType<typeof updateFornecedorSchema>
>;
type FormData = CreateFornecedorFormData | UpdateFornecedorFormData;

export function FormularioFornecedor() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { publicId } = useParams<{ publicId: string }>();
	const queryClient = useQueryClient();
	const toast = useToast();
	const { selectedPartnerId } = usePartnerContext();
	const isEditing = !!publicId;
	const schema = isEditing
		? updateFornecedorSchema(t)
		: createFornecedorSchema(t);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			nome: "",
			email: "",
			telefone: "",
			ruccnpj: "",
			redesocial: "",
		},
	});

	// Buscar dados do fornecedor para edição
	const { data: fornecedorData, isLoading: isLoadingFornecedor } =
		useFornecedoresControllerFindOne(publicId || "", {
			query: {
				enabled: isEditing && !!publicId,
			},
		}) as { data: Fornecedor | undefined; isLoading: boolean };

	// Preencher formulário com dados do fornecedor
	useEffect(() => {
		if (fornecedorData && isEditing) {
			const formData = {
				nome: fornecedorData.nome || "",
				email: fornecedorData.email || "",
				telefone: fornecedorData.telefone || "",
				ruccnpj: fornecedorData.ruccnpj || "",
				redesocial: fornecedorData.redesocial || "",
			};

			reset(formData);
		}
	}, [fornecedorData, isEditing, reset]);

	// Mutation para criar fornecedor
	const createMutation = useFornecedoresControllerCreate({
		mutation: {
			onSuccess: () => {
				toast.success(t("suppliers.messages.createSuccess"));
				queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
				queryClient.invalidateQueries({ queryKey: ["fornecedores-paginated"] });
				navigate("/fornecedores");
			},
			onError: (err: ResponseErrorConfig) => {
				console.error("Erro ao criar fornecedor:", err);
				toast.error(t("suppliers.messages.createError"));
			},
		},
	});

	// Mutation para atualizar fornecedor
	const updateMutation = useFornecedoresControllerUpdate({
		mutation: {
			onSuccess: () => {
				toast.success(t("suppliers.messages.updateSuccess"));
				queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
				queryClient.invalidateQueries({ queryKey: ["fornecedores-paginated"] });
				navigate("/fornecedores");
			},
			onError: (err: ResponseErrorConfig) => {
				console.error("Erro ao atualizar fornecedor:", err);
				toast.error(t("suppliers.messages.updateError"));
			},
		},
	});

	const onSubmit = async (data: FormData) => {
		try {
			// Limpar campos vazios
			const cleanData = {
				...data,
				email: data.email || undefined,
				telefone: data.telefone || undefined,
				ruccnpj: data.ruccnpj || undefined,
				redesocial: data.redesocial || undefined,
			};

			if (isEditing && publicId) {
				await updateMutation.mutateAsync({
					publicId,
					data: cleanData,
				});
			} else {
				if (!selectedPartnerId) {
					throw new Error('Parceiro não selecionado');
				}
				await createMutation.mutateAsync({
					data: {
						...cleanData,
						parceiroId: Number(selectedPartnerId),
					},
				});
			}
		} catch (error) {
			// Erro já tratado nas mutations
			console.error("Erro no submit:", error);
		}
	};

	const handleCancel = () => {
		navigate("/fornecedores");
	};

	if (isEditing && isLoadingFornecedor) {
		return (
			<DashboardLayout>
				<div className='flex items-center justify-center h-64'>
					<Spinner size='lg' />
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className='space-y-6'>
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='/'>{t("menu.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href='/fornecedores'>
								{t("suppliers.title")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{isEditing ? t("suppliers.edit") : t("suppliers.create")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Formulário */}
				<Card>
					<CardHeader>
						<CardTitle>
							{isEditing ? t("suppliers.edit") : t("suppliers.create")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSubmit(onSubmit)}
							className='space-y-6'
						>
							{/* Primeira linha: Nome, Email */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='nome'>
										{t("suppliers.name")}{" "}
										<span className='text-red-500'>*</span>
									</Label>
									<Input
										id='nome'
										placeholder={t("suppliers.namePlaceholder")}
										{...register("nome")}
										className={errors.nome ? "border-red-500" : ""}
									/>
									{errors.nome && (
										<p className='text-sm text-red-500'>
											{errors.nome.message}
										</p>
									)}
								</div>

								<div className='space-y-2'>
									<Label htmlFor='email'>{t("suppliers.email")}</Label>
									<Input
										id='email'
										type='email'
										placeholder={t("suppliers.emailPlaceholder")}
										{...register("email")}
										className={errors.email ? "border-red-500" : ""}
									/>
									{errors.email && (
										<p className='text-sm text-red-500'>
											{errors.email.message}
										</p>
									)}
								</div>
							</div>

							{/* Segunda linha: Telefone, RUC/CNPJ */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='telefone'>{t("suppliers.phone")}</Label>
									<Input
										id='telefone'
										placeholder={t("suppliers.phonePlaceholder")}
										{...register("telefone")}
										className={errors.telefone ? "border-red-500" : ""}
									/>
									{errors.telefone && (
										<p className='text-sm text-red-500'>
											{errors.telefone.message}
										</p>
									)}
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ruccnpj'>{t("suppliers.rucCnpj")}</Label>
									<Input
										id='ruccnpj'
										placeholder={t("suppliers.rucCnpjPlaceholder")}
										{...register("ruccnpj")}
										className={errors.ruccnpj ? "border-red-500" : ""}
									/>
									{errors.ruccnpj && (
										<p className='text-sm text-red-500'>
											{errors.ruccnpj.message}
										</p>
									)}
								</div>
							</div>

							{/* Terceira linha: Rede Social */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='redesocial'>
										{t("suppliers.socialNetwork")}
									</Label>
									<Input
										id='redesocial'
										placeholder={t("suppliers.socialNetworkPlaceholder")}
										{...register("redesocial")}
										className={errors.redesocial ? "border-red-500" : ""}
									/>
									{errors.redesocial && (
										<p className='text-sm text-red-500'>
											{errors.redesocial.message}
										</p>
									)}
								</div>

								<div className='space-y-2'>
									{/* Campo vazio para manter layout */}
									<div></div>
								</div>
							</div>

							{/* Botões */}
							<div className='flex justify-end space-x-2'>
								<Button
									type='button'
									variant='outline'
									onClick={handleCancel}
									disabled={isSubmitting}
								>
									<X className='mr-2 h-4 w-4' />
									{t("common.cancel")}
								</Button>
								<Button
									type='submit'
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<Spinner
											size='sm'
											className='mr-2'
										/>
									) : (
										<Save className='mr-2 h-4 w-4' />
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
