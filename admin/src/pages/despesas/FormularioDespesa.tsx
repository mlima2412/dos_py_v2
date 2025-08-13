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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";

import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useDespesasControllerCreate,
	useDespesasControllerUpdate,
	useDespesasControllerFindOne,
	useCategoriaDespesasControllerFindAll,
	useSubCategoriaDespesaControllerFindByCategoria,
	useFornecedoresControllerFindActiveFornecedores,
	useCurrencyControllerFindAllActive,
	type CreateDespesaDto,
} from "@/api-client";

// Função para criar schema com traduções
const createFormSchema = (t: (key: string) => string) =>
	z.object({
		descricao: z.string().min(1, t("expenses.validation.descriptionRequired")),
		currencyId: z.string().optional(),
		cotacao: z
			.number()
			.min(0.0, t("expenses.validation.exchangeMin"))
			.optional(),
		valor: z.number().min(0.01, t("expenses.validation.valueMin")),
		dataDespesa: z.date({ message: t("expenses.validation.dateRequired") }),
		fornecedorId: z.string().optional(),
		dataVencimento: z.date().optional(),
		categoriaId: z.string().min(1, t("expenses.validation.categoryRequired")),
		subCategoriaId: z
			.string()
			.min(1, t("expenses.validation.subcategoryRequired")),
	});

export function FormularioDespesa() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const { selectedPartnerId } = usePartnerContext();
	const isEditing = Boolean(id);

	const [selectedCategoria, setSelectedCategoria] = useState<string>("");
	const [valorInput, setValorInput] = useState<string>("");
	const [cotacaoInput, setCotacaoInput] = useState<string>("1");
	const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

	// Criar schema com traduções
	const formSchema = createFormSchema(t);
	type FormData = z.infer<typeof formSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			descricao: "",
			currencyId: "",
			cotacao: 0,
			valor: 0,
			dataDespesa: new Date(),
			fornecedorId: "",
			dataVencimento: undefined,
			categoriaId: "",
			subCategoriaId: "",
		},
	});

	// Queries
	const { data: despesa, isLoading: isLoadingDespesa } =
		useDespesasControllerFindOne(id!, { query: { enabled: isEditing } });

	const { data: categorias = [], isLoading: isLoadingCategorias } =
		useCategoriaDespesasControllerFindAll();

	const { data: subcategorias = [], isLoading: isLoadingSubcategorias } =
		useSubCategoriaDespesaControllerFindByCategoria(Number(selectedCategoria), {
			query: { enabled: Boolean(selectedCategoria) },
		});

	const { data: fornecedores = [], isLoading: isLoadingFornecedores } =
		useFornecedoresControllerFindActiveFornecedores();

	const { data: moedas = [], isLoading: isLoadingMoedas } =
		useCurrencyControllerFindAllActive();

	// Mutations
	const createMutation = useDespesasControllerCreate();
	const updateMutation = useDespesasControllerUpdate();

	// Populate form when editing
	useEffect(() => {
		if (despesa && isEditing) {
			setIsInitialLoad(true);
			form.reset({
				descricao: despesa.descricao,
				currencyId: despesa.currencyId?.toString() || "",
				cotacao: despesa.cotacao || 1,
				valor: despesa.valor,
				dataDespesa: new Date(despesa.dataDespesa),
				fornecedorId: despesa.fornecedorId?.toString() || "",
				dataVencimento: despesa.dataVencimento
					? new Date(despesa.dataVencimento)
					: undefined,
				categoriaId: despesa.subCategoria?.categoriaId?.toString() || "",
				subCategoriaId: "", // Será preenchido após carregar as subcategorias
			});

			setSelectedCategoria(despesa.subCategoria?.categoriaId?.toString() || "");
			setValorInput(despesa.valor.toString());
			setCotacaoInput((despesa.cotacao || 1).toString());
		}
	}, [despesa, isEditing, form]);

	// Preencher subcategoria após carregar as subcategorias durante edição
	useEffect(() => {
		if (
			despesa &&
			isEditing &&
			subcategorias.length > 0 &&
			selectedCategoria &&
			isInitialLoad
		) {
			const subCategoriaId = despesa.subCategoriaId?.toString() || "";
			if (
				subCategoriaId &&
				subcategorias.some(
					(sub) => sub.idSubCategoria?.toString() === subCategoriaId
				)
			) {
				form.setValue("subCategoriaId", subCategoriaId);
				// Aguardar um pouco para permitir que a subcategoria seja definida antes de marcar como não sendo carregamento inicial
				setTimeout(() => setIsInitialLoad(false), 100);
			} else {
				// Se não encontrou a subcategoria, ainda assim marca como não sendo carregamento inicial
				setTimeout(() => setIsInitialLoad(false), 100);
			}
		}
	}, [
		despesa,
		isEditing,
		subcategorias,
		selectedCategoria,
		form,
		isInitialLoad,
	]);

	// Reset subcategoria when categoria changes (but not during initial load)
	useEffect(() => {
		if (selectedCategoria && !isInitialLoad && !isEditing) {
			form.setValue("subCategoriaId", "");
		}
	}, [selectedCategoria, form, isInitialLoad, isEditing]);

	const toast = useToast();

	const onSubmit = async (data: FormData) => {
		if (!selectedPartnerId) {
			toast.error(t("expenses.noPartnerSelected"));
			return;
		}

		try {
			const payload: CreateDespesaDto = {
				descricao: data.descricao,
				valor: data.valor,
				dataDespesa: data.dataDespesa.toISOString(),
				subCategoriaId: Number(data.subCategoriaId),
				parceiroId: Number(selectedPartnerId!),
			};

			// Adicionar campos opcionais apenas se tiverem valor
			if (data.currencyId) {
				payload.currencyId = Number(data.currencyId);
			}
			if (data.cotacao) {
				payload.cotacao = data.cotacao;
			}
			if (data.fornecedorId) {
				payload.fornecedorId = Number(data.fornecedorId);
			}
			if (data.dataVencimento) {
				payload.dataVencimento = data.dataVencimento.toISOString();
			}
			console.log(payload);

			if (isEditing) {
				await updateMutation.mutateAsync({ publicId: id!, data: payload });
				toast.success(t("expenses.messages.updateSuccess"));
			} else {
				await createMutation.mutateAsync({ data: payload });
				toast.success(t("expenses.messages.createSuccess"));
			}

			navigate("/despesas");
		} catch {
			toast.error(
				isEditing
					? t("expenses.messages.updateError")
					: t("expenses.messages.createError")
			);
		}
	};

	// Prepare options for selects

	const subcategoriaOptions: ComboboxOption[] = subcategorias
		.filter(
			(subcategoria) => subcategoria.idSubCategoria && subcategoria.descricao
		)
		.map((subcategoria) => ({
			value: subcategoria.idSubCategoria!.toString(),
			label: subcategoria.descricao!,
		}));

	const fornecedorOptions: ComboboxOption[] = fornecedores.map(
		(fornecedor) => ({
			value: fornecedor.id.toString(),
			label: fornecedor.nome,
		})
	);

	const moedaOptions: ComboboxOption[] = moedas.map((moeda) => ({
		value: moeda.id.toString(),
		label: `${moeda.isoCode} - ${moeda.nome}`,
	}));

	if (isLoadingDespesa && isEditing) {
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
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='/'>{t("menu.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href='/despesas'>
								{t("expenses.title")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{isEditing ? t("expenses.edit") : t("expenses.new")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<Card>
					<CardContent className='pt-6'>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className='space-y-6'
							>
								{/* Primeira linha: Descrição */}
								<div className='grid grid-cols-1 gap-4'>
									<FormField
										control={form.control}
										name='descricao'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.description")}</FormLabel>
												<FormControl>
													<Input
														placeholder={t("expenses.descriptionPlaceholder")}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Segunda linha: Moeda, Cotação, Valor */}
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									<FormField
										control={form.control}
										name='currencyId'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("expenses.currency")} ({t("common.optional")})
												</FormLabel>
												<FormControl>
													<Combobox
														options={moedaOptions}
														value={field.value}
														onValueChange={field.onChange}
														placeholder={t("expenses.selectCurrency")}
														searchPlaceholder={t("expenses.searchCurrency")}
														emptyText={t("expenses.noCurrencyFound")}
														disabled={isLoadingMoedas}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='cotacao'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.exchangeRate")}</FormLabel>
												<FormControl>
													<CurrencyInput
														placeholder='1,00'
														value={cotacaoInput}
														decimalsLimit={4}
														decimalSeparator=','
														groupSeparator='.'
														onValueChange={(value) => {
															setCotacaoInput(value || "");
															field.onChange(
																parseFloat(value?.replace(",", ".") || "0")
															);
														}}
														className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='valor'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.amount")}</FormLabel>
												<FormControl>
													<CurrencyInput
														placeholder='0,00'
														value={valorInput}
														decimalsLimit={2}
														decimalSeparator=','
														groupSeparator='.'
														onValueChange={(value) => {
															setValorInput(value || "");
															field.onChange(
																parseFloat(value?.replace(",", ".") || "0")
															);
														}}
														className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Terceira linha: Fornecedor, Data, Data de Vencimento */}
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									<FormField
										control={form.control}
										name='fornecedorId'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("expenses.supplier")} ({t("common.optional")})
												</FormLabel>
												<FormControl>
													<Combobox
														options={fornecedorOptions}
														value={field.value}
														onValueChange={field.onChange}
														placeholder={t("expenses.selectSupplier")}
														searchPlaceholder={t("expenses.searchSupplier")}
														emptyText={t("expenses.noSupplierFound")}
														disabled={isLoadingFornecedores}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='dataDespesa'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.date")}</FormLabel>
												<FormControl>
													<DatePicker
														date={field.value}
														onDateChange={field.onChange}
														placeholder={t("expenses.selectDate")}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='dataVencimento'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("expenses.dueDate")} ({t("common.optional")})
												</FormLabel>
												<FormControl>
													<DatePicker
														date={field.value}
														onDateChange={field.onChange}
														placeholder={t("expenses.selectDueDate")}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Quarta linha: Categoria e Subcategoria */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='categoriaId'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.category")}</FormLabel>
												<FormControl>
													<RadioGroup
														value={field.value}
														onValueChange={(value) => {
															field.onChange(value);
															setSelectedCategoria(value);
														}}
														className='grid grid-cols-1 gap-2'
														disabled={isLoadingCategorias}
													>
														{categorias.map((categoria) => (
															<div
																key={categoria.idCategoria}
																className='flex items-center space-x-2'
															>
																<RadioGroupItem
																	value={
																		categoria.idCategoria?.toString() || ""
																	}
																	id={`categoria-${categoria.idCategoria}`}
																/>
																<Label
																	htmlFor={`categoria-${categoria.idCategoria}`}
																	className='text-sm font-normal cursor-pointer'
																>
																	{categoria.descricao}
																</Label>
															</div>
														))}
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='subCategoriaId'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.subcategory")}</FormLabel>
												<FormControl>
													<Combobox
														options={subcategoriaOptions}
														value={field.value}
														onValueChange={field.onChange}
														placeholder={t("expenses.selectSubcategory")}
														searchPlaceholder={t("expenses.searchSubcategory")}
														emptyText={t("expenses.noSubcategoryFound")}
														disabled={
															isLoadingSubcategorias || !selectedCategoria
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className='flex justify-end space-x-4'>
									<Button
										type='button'
										variant='outline'
										disabled={
											createMutation.isPending || updateMutation.isPending
										}
										onClick={() => navigate("/despesas")}
									>
										<X className='mr-2 h-4 w-4' />
										{t("common.cancel")}
									</Button>
									<Button
										type='submit'
										disabled={
											createMutation.isPending || updateMutation.isPending
										}
									>
										{createMutation.isPending || updateMutation.isPending ? (
											<>
												<Spinner
													size='sm'
													className='mr-2'
												/>
												{isEditing
													? t("common.updating")
													: t("common.creating")}
											</>
										) : (
											<>
												<Save className='mr-2 h-4 w-4' />
												{isEditing ? t("common.update") : t("common.create")}
											</>
										)}
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
