import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import {
	useFormaPagamento,
	useFormaPagamentoMutations,
} from "@/hooks/useFormasPagamento";
import { useContaDreControllerFindAll } from "@/api-client/hooks/useContaDreControllerFindAll";
import { usePartner } from "@/hooks/usePartner";

// Schema de validação baseado no DTO
const formaPagamentoSchema = z
	.object({
		nome: z
			.string()
			.min(2, "Nome deve ter pelo menos 2 caracteres")
			.max(255, "Nome deve ter no máximo 255 caracteres"),
		taxa: z.number().min(0, "Taxa deve ser maior ou igual a zero").optional(),
		tempoLiberacao: z
			.number()
			.min(0, "Tempo de liberação deve ser maior ou igual a zero"),
		impostoPosCalculo: z.boolean(),
		contaDreId: z.number().optional(),
		ativo: z.boolean(),
	})
	.refine(
		data => {
			// Se taxa > 0, contaDreId é obrigatório
			if (data.taxa && data.taxa > 0) {
				return data.contaDreId !== undefined && data.contaDreId > 0;
			}
			return true;
		},
		{
			message: "Conta DRE é obrigatória quando há taxa configurada",
			path: ["contaDreId"],
		}
	);

type FormaPagamentoFormData = z.infer<typeof formaPagamentoSchema>;

type FormMode = "create" | "edit" | "view";

export const FormularioFormaPagamento: React.FC = () => {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const { selectedPartnerId } = usePartner();

	// Determinar modo do formulário
	const mode: FormMode = id
		? window.location.pathname.includes("/editar")
			? "edit"
			: "view"
		: "create";

	// Hooks para dados e mutações
	const { formaPagamento, isLoading: isLoadingData } = useFormaPagamento(
		id ? parseInt(id) : 0
	);
	const { createFormaPagamento, updateFormaPagamento, isCreating, isUpdating } =
		useFormaPagamentoMutations();

	// Buscar todas as contas DRE do parceiro
	const headers = {
		"x-parceiro-id": selectedPartnerId ? parseInt(selectedPartnerId) : 0,
	};
	const { data: contasDre, isLoading: isLoadingContasDre } =
		useContaDreControllerFindAll(headers, {
			query: {
				enabled: !!selectedPartnerId,
			},
		});

	// Preparar opções para o combobox
	const contaDreOptions = useMemo(() => {
		if (!contasDre) return [];
		return contasDre.map(conta => ({
			value: conta.id.toString(),
			label: conta.nome,
		}));
	}, [contasDre]);

	// Formulário
	const form = useForm<FormaPagamentoFormData>({
		resolver: zodResolver(formaPagamentoSchema),
		defaultValues: {
			nome: "",
			taxa: undefined,
			tempoLiberacao: 0,
			impostoPosCalculo: false,
			contaDreId: undefined,
			ativo: true,
		},
	});

	// Observar o valor da taxa para mostrar/ocultar campo de conta DRE
	const taxaValue = useWatch({ control: form.control, name: "taxa" });

	// Carregar dados quando em modo de edição/visualização
	useEffect(() => {
		if (formaPagamento && (mode === "edit" || mode === "view")) {
			form.reset({
				nome: formaPagamento.nome,
				taxa: formaPagamento.taxa,
				tempoLiberacao: formaPagamento.tempoLiberacao,
				impostoPosCalculo: formaPagamento.impostoPosCalculo,
				contaDreId: formaPagamento.contaDreId,
				ativo: formaPagamento.ativo,
			});
		}
	}, [formaPagamento, mode, form]);

	// Mostrar campo de conta DRE apenas quando taxa > 0
	const showContaDreField = taxaValue !== undefined && taxaValue > 0;

	// Função para submeter o formulário
	const onSubmit = (data: FormaPagamentoFormData) => {
		if (mode === "create") {
			createFormaPagamento(data);
			// Redirecionar após sucesso será feito pelo hook
		} else if (mode === "edit") {
			updateFormaPagamento(parseInt(id!), data);
		}
	};

	// Função para voltar
	const handleBack = () => {
		navigate("/formaPagamento");
	};

	// Títulos baseados no modo
	const getTitle = () => {
		switch (mode) {
			case "create":
				return t("paymentMethods.create");
			case "edit":
				return t("paymentMethods.edit");
			case "view":
				return t("paymentMethods.view");
			default:
				return t("paymentMethods.create");
		}
	};

	const getSubtitle = () => {
		switch (mode) {
			case "create":
				return "Criar uma nova forma de pagamento";
			case "edit":
				return "Editar forma de pagamento existente";
			case "view":
				return "Visualizar detalhes da forma de pagamento";
			default:
				return "Criar uma nova forma de pagamento";
		}
	};

	if (isLoadingData && (mode === "edit" || mode === "view")) {
		return (
			
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink href="/formaPagamento">
										{t("paymentMethods.title")}
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>{getTitle()}</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<Card>
						<CardContent className="pt-6">
							<div className="text-center py-8">{t("common.loading")}</div>
						</CardContent>
					</Card>
				</div>
			
		);
	}

	return (
		
			<div className="space-y-2">
				{/* Breadcrumb */}
				<div className="flex justify-between items-center">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="/formaPagamento">
									{t("paymentMethods.title")}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{getTitle()}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{/* Formulário */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleBack}
								className="p-0 h-auto"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Voltar
							</Button>
							<div>
								<CardTitle>{getTitle()}</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									{getSubtitle()}
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								{/* Nome */}
								<FormField
									control={form.control}
									name="nome"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("paymentMethods.labels.name")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("paymentMethods.placeholders.name")}
													disabled={mode === "view"}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Taxa */}
								<FormField
									control={form.control}
									name="taxa"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("paymentMethods.labels.tax")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													placeholder={t("paymentMethods.placeholders.tax")}
													disabled={mode === "view"}
													{...field}
													value={field.value ?? ""}
													onChange={e => {
														const value = e.target.value;
														field.onChange(
															value === "" ? undefined : parseFloat(value)
														);
													}}
												/>
											</FormControl>
											<FormDescription>
												{t("paymentMethods.hints.tax")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Conta DRE - visível apenas quando taxa > 0 */}
								{showContaDreField && (
									<FormField
										control={form.control}
										name="contaDreId"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>
													{t("paymentMethods.labels.contaDre")}
												</FormLabel>
												<FormControl>
													<Combobox
														options={contaDreOptions}
														value={field.value?.toString() ?? ""}
														onValueChange={value =>
															field.onChange(value ? parseInt(value) : undefined)
														}
														placeholder={t(
															"paymentMethods.placeholders.contaDre"
														)}
														searchPlaceholder={t(
															"paymentMethods.placeholders.searchContaDre"
														)}
														emptyText={t("paymentMethods.noContaDreResults")}
														disabled={mode === "view" || isLoadingContasDre}
													/>
												</FormControl>
												<FormDescription>
													{t("paymentMethods.hints.contaDre")}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{/* Tempo de Liberação */}
								<FormField
									control={form.control}
									name="tempoLiberacao"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("paymentMethods.labels.releaseTime")}
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													placeholder={t(
														"paymentMethods.placeholders.releaseTime"
													)}
													disabled={mode === "view"}
													{...field}
													value={field.value ?? ""}
													onChange={e => {
														const value = e.target.value;
														field.onChange(
															value === "" ? 0 : parseInt(value, 10)
														);
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Imposto Pós Cálculo - visível apenas quando taxa > 0 */}
								{showContaDreField && (
									<FormField
										control={form.control}
										name="impostoPosCalculo"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
														disabled={mode === "view"}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>
														{t("paymentMethods.labels.taxAfterCalculation")}
													</FormLabel>
													<FormDescription>
														{t("paymentMethods.hints.taxAfterCalculation")}
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>
								)}

								{/* Ativo */}
								<FormField
									control={form.control}
									name="ativo"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
													disabled={mode === "view"}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>
													{t("paymentMethods.labels.active")}
												</FormLabel>
											</div>
										</FormItem>
									)}
								/>

								{/* Botões */}
								{mode !== "view" && (
									<div className="flex justify-end gap-4">
										<Button
											type="button"
											variant="outline"
											onClick={handleBack}
										>
											{t("common.cancel")}
										</Button>
										<Button type="submit" disabled={isCreating || isUpdating}>
											<Save className="h-4 w-4 mr-2" />
											{isCreating || isUpdating
												? t("common.saving")
												: t("common.save")}
										</Button>
									</div>
								)}

								{mode === "view" && (
									<div className="flex justify-end gap-4">
										<Button
											type="button"
											variant="outline"
											onClick={handleBack}
										>
											{t("common.close")}
										</Button>
										<Button type="button" asChild>
											<Link to={`/formaPagamento/editar/${id}`}>
												{t("common.edit")}
											</Link>
										</Button>
									</div>
								)}
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		
	);
};
