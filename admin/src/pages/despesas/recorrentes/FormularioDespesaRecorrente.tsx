import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import CurrencyInput from "react-currency-input-field";
import { Save, X } from "lucide-react";

import { useToast } from "@/hooks/useToast";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useDespesasRecorrentesControllerCreate,
	useDespesasRecorrentesControllerFindOne,
	useDespesasRecorrentesControllerUpdate,
	useCategoriaDespesasControllerFindAll,
	useSubCategoriaDespesaControllerFindByCategoria,
	useFornecedoresControllerFindActiveFornecedores,
	useCurrencyControllerFindAllActive,
	type CreateDespesaRecorrenteDto,
	type UpdateDespesaRecorrenteDto,
} from "@/api-client";

// Função para criar schema com traduções
const createFormSchema = (t: (key: string) => string) =>
	z.object({
		descricao: z
			.string()
			.min(1, t("recurringExpenses.validation.descriptionRequired")),
		valor: z.number().min(0.01, t("recurringExpenses.validation.valueMin")),
		frequencia: z.enum(
			["SEMANAL", "QUINZENAL", "MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"],
			{
				message: t("recurringExpenses.validation.frequencyRequired"),
			}
		),
		diaVencimento: z
			.number()
			.min(1, t("recurringExpenses.validation.dueDayMin"))
			.max(31, t("recurringExpenses.validation.dueDayMax")),
		dataInicio: z.date({
			message: t("recurringExpenses.validation.startDateRequired"),
		}),
		dataFim: z.date().optional(),
		fornecedorId: z.string().optional(),
		categoriaId: z.string().optional(),
		subCategoriaId: z
			.string()
			.min(1, t("recurringExpenses.validation.subcategoryRequired")),
		currencyId: z.string().optional(),
		cotacao: z.number().optional(),
	});

export function FormularioDespesaRecorrente() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const { selectedPartnerId } = usePartnerContext();

	const toast = useToast();
	const isEditing = Boolean(id);

	const [valorInput, setValorInput] = useState<string>("");
	const [cotacaoInput, setCotacaoInput] = useState<string>("");
	const [selectedCategoria, setSelectedCategoria] = useState<string>("");

	// Criar schema com traduções
	const formSchema = createFormSchema(t);
	type FormData = z.infer<typeof formSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			descricao: "",
			valor: 0,
			frequencia: "MENSAL",
			diaVencimento: 1,
			dataInicio: new Date(),
			dataFim: undefined,
			fornecedorId: "",
			categoriaId: "",
			subCategoriaId: "",
			currencyId: "", // currencyId será selecionado pelo usuário no formulário
			cotacao: 1,
		},
	});

	// Queries
	const { data: despesaRecorrente, isLoading: isLoadingDespesa } =
		useDespesasRecorrentesControllerFindOne(id!, {
			query: { enabled: isEditing && Boolean(id) },
		});

	const { data: categorias = [] } = useCategoriaDespesasControllerFindAll();

	const { data: subcategorias = [] } =
		useSubCategoriaDespesaControllerFindByCategoria(Number(selectedCategoria), {
			query: { enabled: Boolean(selectedCategoria) },
		});

	const { data: fornecedores = [] } =
		useFornecedoresControllerFindActiveFornecedores();

	const { data: currencies = [] } = useCurrencyControllerFindAllActive();

	// Mutations
	const createMutation = useDespesasRecorrentesControllerCreate({
		mutation: {
			onSuccess: () => {
				toast.success(t("recurringExpenses.messages.createSuccess") as string);
				navigate("/despesas/recorrentes");
			},
			onError: (error: unknown) => {
				toast.error(
					(error as Error)?.message ||
						(t("recurringExpenses.messages.createError") as string)
				);
			},
		},
	});

	const updateMutation = useDespesasRecorrentesControllerUpdate({
		mutation: {
			onSuccess: () => {
				toast.success(t("recurringExpenses.messages.updateSuccess") as string);
				navigate("/despesas/recorrentes");
			},
			onError: (error: unknown) => {
				toast.error(
					(error as Error)?.message ||
						(t("recurringExpenses.messages.updateError") as string)
				);
			},
		},
	});

	// Nota: O preenchimento automático da moeda do parceiro foi removido
	// pois o currencyId não está disponível nos dados básicos do parceiro do contexto

	// Populate form when editing
	useEffect(() => {
		console.log("useEffect triggered:", { despesaRecorrente, isEditing, id });
		if (despesaRecorrente && isEditing) {
			console.log("Populating form with data:", despesaRecorrente);
			const subcategoriaId = despesaRecorrente.subCategoriaId?.toString() || "";
			const categoriaId =
				despesaRecorrente.subCategoria?.categoriaId?.toString() || "";

			setSelectedCategoria(categoriaId);
			setValorInput(despesaRecorrente.valor.toString());
			setCotacaoInput(despesaRecorrente.cotacao?.toString() || "1");

			form.reset({
				descricao: despesaRecorrente.descricao,
				valor: despesaRecorrente.valor,
				frequencia: despesaRecorrente.frequencia as
					| "SEMANAL"
					| "QUINZENAL"
					| "MENSAL"
					| "TRIMESTRAL"
					| "SEMESTRAL"
					| "ANUAL",
				diaVencimento: despesaRecorrente.diaVencimento,
				dataInicio: new Date(despesaRecorrente.dataInicio),
				dataFim: despesaRecorrente.dataFim
					? new Date(despesaRecorrente.dataFim)
					: undefined,
				fornecedorId: despesaRecorrente.fornecedorId?.toString() || "",
				categoriaId: categoriaId,
				subCategoriaId: subcategoriaId,
				currencyId: despesaRecorrente.currencyId?.toString() || "",
				cotacao: despesaRecorrente.cotacao || 1,
			});
		}
	}, [despesaRecorrente, isEditing, form]);

	// Handle form submission
	const onSubmit = async (data: FormData) => {
		if (!selectedPartnerId) {
			toast.error(t("recurringExpenses.validation.partnerRequired") as string);
			return;
		}

		const payload = {
			descricao: data.descricao,
			valor: data.valor,
			frequencia: data.frequencia,
			diaVencimento: data.diaVencimento,
			dataInicio: data.dataInicio.toISOString(),
			dataFim: data.dataFim?.toISOString(),
			parceiroId: Number(selectedPartnerId),
			fornecedorId: data.fornecedorId ? Number(data.fornecedorId) : undefined,
			subCategoriaId: Number(data.subCategoriaId),
			currencyId: data.currencyId ? Number(data.currencyId) : undefined,
			cotacao: data.cotacao,
		};

		if (isEditing) {
			await updateMutation.mutateAsync({
				publicId: id!,
				data: payload as UpdateDespesaRecorrenteDto,
			});
		} else {
			await createMutation.mutateAsync({
				data: payload as CreateDespesaRecorrenteDto,
			});
		}
	};

	// Handle cancel
	const handleCancel = () => {
		navigate("/despesas/recorrentes");
	};

	// Prepare options for comboboxes
	const categoriaOptions: ComboboxOption[] = categorias.map(categoria => ({
		value: categoria.idCategoria?.toString() || "",
		label: categoria.descricao || "",
	}));

	const subcategoriaOptions: ComboboxOption[] = subcategorias.map(
		subcategoria => ({
			value: subcategoria.idSubCategoria?.toString() || "",
			label: subcategoria.descricao || "",
		})
	);

	const fornecedorOptions: ComboboxOption[] = fornecedores.map(fornecedor => ({
		value: fornecedor.id.toString(),
		label: fornecedor.nome,
	}));

	const currencyOptions: ComboboxOption[] = currencies.map(currency => ({
		value: currency.id?.toString() || "",
		label: `${currency.isoCode || currency.prefixo} - ${currency.nome || ""}`,
	}));

	const frequencyOptions = [
		{ value: "SEMANAL", label: t("recurringExpenses.frequencyOptions.weekly") },
		{
			value: "QUINZENAL",
			label: t("recurringExpenses.frequencyOptions.biweekly"),
		},
		{ value: "MENSAL", label: t("recurringExpenses.frequencyOptions.monthly") },
		{
			value: "TRIMESTRAL",
			label: t("recurringExpenses.frequencyOptions.quarterly"),
		},
		{
			value: "SEMESTRAL",
			label: t("recurringExpenses.frequencyOptions.semiannual"),
		},
		{ value: "ANUAL", label: t("recurringExpenses.frequencyOptions.yearly") },
	];

	if (isLoadingDespesa) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
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
							<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />

						<BreadcrumbItem>
							<BreadcrumbLink href="/despesas/recorrentes">
								{t("recurringExpenses.title")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{isEditing
									? t("recurringExpenses.edit")
									: t("recurringExpenses.new")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Form */}
				<Card>
					<CardContent className="pt-2">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-3"
							>
								{/* Informações Básicas */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<FormField
										control={form.control}
										name="descricao"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.description")}
												</FormLabel>
												<FormControl>
													<Input
														placeholder={t(
															"recurringExpenses.descriptionPlaceholder"
														)}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="valor"
										render={({ field }) => {
											// Buscar a moeda selecionada para obter o prefixo
											const selectedCurrencyId = form.watch("currencyId");
											const selectedCurrency = currencies?.find(
												c => c.id?.toString() === selectedCurrencyId
											);
											const currencyPrefix = selectedCurrency?.prefixo || "R$ ";

											return (
												<FormItem>
													<FormLabel>{t("expenses.totalAmount")}</FormLabel>
													<FormControl>
														<CurrencyInput
															placeholder={t(
																"recurringExpenses.valuePlaceholder"
															)}
															value={valorInput}
															onValueChange={value => {
																setValorInput(value || "");
																field.onChange(parseFloat(value || "0"));
															}}
															decimalSeparator=","
															groupSeparator="."
															prefix={currencyPrefix + " "}
															decimalScale={2}
															className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											);
										}}
									/>
								</div>

								{/* Frequência e Vencimento */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="frequencia"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.frequency")}
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"recurringExpenses.frequencyPlaceholder"
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{frequencyOptions.map(option => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="diaVencimento"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("recurringExpenses.dueDay")}</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														max={31}
														placeholder={t(
															"recurringExpenses.dueDayPlaceholder"
														)}
														{...field}
														onChange={e =>
															field.onChange(parseInt(e.target.value) || 1)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Datas */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="dataInicio"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.startDate")}
												</FormLabel>
												<FormControl>
													<DatePicker
														date={field.value}
														onDateChange={field.onChange}
														placeholder={t(
															"recurringExpenses.startDatePlaceholder"
														)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="dataFim"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.endDate")} (
													{t("common.optional")})
												</FormLabel>
												<FormControl>
													<DatePicker
														date={field.value}
														onDateChange={field.onChange}
														placeholder={t("recurringExpenses.selectEndDate")}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Categoria e Subcategoria */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="categoriaId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("recurringExpenses.category")}</FormLabel>
												<FormControl>
													<Combobox
														options={categoriaOptions}
														value={field.value}
														onValueChange={(value: string) => {
															field.onChange(value);
															setSelectedCategoria(value);
															form.setValue("subCategoriaId", "");
														}}
														placeholder={t(
															"recurringExpenses.categoryPlaceholder"
														)}
														emptyText={t("recurringExpenses.noCategoriesFound")}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="subCategoriaId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.subcategory")}
												</FormLabel>
												<FormControl>
													<Combobox
														options={subcategoriaOptions}
														value={field.value}
														onValueChange={field.onChange}
														placeholder={t(
															"recurringExpenses.subcategoryPlaceholder"
														)}
														emptyText={t(
															"recurringExpenses.noSubcategoriesFound"
														)}
														disabled={!selectedCategoria}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Fornecedor */}
								<div className="grid grid-cols-1 gap-3">
									<FormField
										control={form.control}
										name="fornecedorId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.supplier")} (
													{t("common.optional")})
												</FormLabel>
												<FormControl>
													<Combobox
														options={fornecedorOptions}
														value={field.value}
														onValueChange={field.onChange}
														placeholder={t(
															"recurringExpenses.supplierPlaceholder"
														)}
														emptyText={t("recurringExpenses.noSuppliersFound")}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Moeda e Cotação */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="currencyId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.currency")} (
													{t("common.optional")})
												</FormLabel>
												<FormControl>
													<Combobox
														options={currencyOptions}
														value={field.value}
														onValueChange={field.onChange}
														placeholder={t(
															"recurringExpenses.currencyPlaceholder"
														)}
														emptyText={t("recurringExpenses.noCurrenciesFound")}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="cotacao"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("recurringExpenses.exchangeRate")} (
													{t("common.optional")})
												</FormLabel>
												<FormControl>
													<CurrencyInput
														placeholder={t(
															"recurringExpenses.exchangeRatePlaceholder"
														)}
														value={cotacaoInput}
														onValueChange={value => {
															setCotacaoInput(value || "");
															field.onChange(parseFloat(value || "1"));
														}}
														decimalSeparator=","
														groupSeparator="."
														decimalScale={4}
														className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Botões */}
								<div className="flex justify-end space-x-4">
									<Button
										type="button"
										variant="outline"
										onClick={handleCancel}
										disabled={
											createMutation.isPending || updateMutation.isPending
										}
									>
										<X className="mr-2 h-4 w-4" />
										{t("common.cancel")}
									</Button>
									<Button
										type="submit"
										disabled={
											createMutation.isPending || updateMutation.isPending
										}
									>
										{createMutation.isPending || updateMutation.isPending ? (
											<Spinner size="sm" className="mr-2" />
										) : (
											<Save className="mr-2 h-4 w-4" />
										)}
										{isEditing ? t("common.update") : t("common.save")}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}

export default FormularioDespesaRecorrente;
