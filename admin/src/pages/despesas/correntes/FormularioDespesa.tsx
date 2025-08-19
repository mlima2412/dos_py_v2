import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useDespesasControllerCreate,
	useDespesasControllerFindOne,
	useCategoriaDespesasControllerFindAll,
	useSubCategoriaDespesaControllerFindByCategoria,
	useFornecedoresControllerFindActiveFornecedores,
	useCurrencyControllerFindAllActive,
	type CreateDespesaDto,
	type ContasPagar,
} from "@/api-client";
import { TabelaParcelas } from "../components/TabelaParcelas";
import { useContasPagarControllerFindByDespesa } from "@/api-client";

// Função para criar schema com traduções
const createFormSchema = (t: (key: string) => string) =>
	z.object({
		descricao: z.string().min(1, t("expenses.validation.descriptionRequired")),
		valorTotal: z.number().min(0.01, t("expenses.validation.valueMin")),
		dataRegistro: z.date({ message: t("expenses.validation.dateRequired") }),
		fornecedorId: z.string().optional(),
		categoriaId: z.string().min(1, t("expenses.validation.categoryRequired")),
		subCategoriaId: z
			.string()
			.min(1, t("expenses.validation.subcategoryRequired")),
		currencyId: z.string().optional(),
		cotacao: z.number().optional(),
		tipoPagamento: z.enum(
			["A_VISTA_IMEDIATA", "A_PRAZO_SEM_PARCELAS", "PARCELADO"],
			{
				message: t("expenses.validation.paymentTypeRequired"),
			}
		),
		valorEntrada: z
			.number()
			.min(0, t("expenses.validation.entryValueMin"))
			.optional(),
		numeroParcelas: z
			.number()
			.min(1, t("expenses.validation.installmentsMin"))
			.optional(),
		dataPrimeiraParcela: z.date().optional(),
		dataVencimento: z.date().optional(),
	});

export function FormularioDespesa() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const { selectedPartnerId } = usePartnerContext();
	const isEditing = Boolean(id);
	const isViewing = location.pathname.includes("/visualizar/");

	const [selectedCategoria, setSelectedCategoria] = useState<string>("");
	const [valorTotalInput, setValorTotalInput] = useState<string>("");
	const [valorEntradaInput, setValorEntradaInput] = useState<string>("");
	const [cotacaoInput, setCotacaoInput] = useState<string>("");

	const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
	const [tipoPagamento, setTipoPagamento] = useState<string>("avista");

	// Criar schema com traduções
	const formSchema = createFormSchema(t);
	type FormData = z.infer<typeof formSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			descricao: "",
			valorTotal: 0,
			dataRegistro: new Date(),
			fornecedorId: "",
			categoriaId: "",
			subCategoriaId: "",
			currencyId: "", // currencyId será selecionado pelo usuário no formulário
			cotacao: 0,
			tipoPagamento: "A_VISTA_IMEDIATA",
			valorEntrada: 0,
			numeroParcelas: 1,
			dataPrimeiraParcela: undefined,
			dataVencimento: undefined,
		},
	});

	// Queries
	const { data: despesa, isLoading: isLoadingDespesa } =
		useDespesasControllerFindOne(
			id!,
			{ "x-parceiro-id": Number(selectedPartnerId!) },
			{ query: { enabled: isEditing && Boolean(selectedPartnerId) } }
		);

	// Buscar contas a pagar da despesa para obter o contasPagarId
	const { data: contasPagar } = useContasPagarControllerFindByDespesa(
		despesa?.id || 0,
		{
			query: {
				enabled: Boolean(despesa?.id) && (isEditing || isViewing),
			},
		}
	);

	const { data: categorias = [], isLoading: isLoadingCategorias } =
		useCategoriaDespesasControllerFindAll();

	const { data: subcategorias = [], isLoading: isLoadingSubcategorias } =
		useSubCategoriaDespesaControllerFindByCategoria(Number(selectedCategoria), {
			query: { enabled: Boolean(selectedCategoria) },
		});

	const { data: fornecedores = [], isLoading: isLoadingFornecedores } =
		useFornecedoresControllerFindActiveFornecedores();

	const { data: currencies = [], isLoading: isLoadingCurrencies } =
		useCurrencyControllerFindAllActive();

	// Mutations
	const createMutation = useDespesasControllerCreate();

	// Determine payment type based on parcelas
	const determineTipoPagamento = (contasPagar: ContasPagar[]) => {
		if (!contasPagar || contasPagar.length === 0) {
			return "A_VISTA_IMEDIATA";
		}

		const parcelas = contasPagar[0]?.contasPagarParcelas || [];
		if (parcelas.length === 0) {
			return "A_VISTA_IMEDIATA";
		}

		if (parcelas.length === 1) {
			// Se tem uma parcela e a data de vencimento é diferente da data de registro, é A_PRAZO_SEM_PARCELAS
			const parcela = parcelas[0];
			const dataVencimento = new Date(parcela.dataVencimento);
			const dataRegistro = new Date(despesa?.dataRegistro || new Date());

			// Se a diferença for maior que 1 dia, considera como prazo
			const diffDays =
				Math.abs(dataVencimento.getTime() - dataRegistro.getTime()) /
				(1000 * 60 * 60 * 24);
			return diffDays > 1 ? "A_PRAZO_SEM_PARCELAS" : "A_VISTA_IMEDIATA";
		}

		return "PARCELADO";
	};

	// Populate form when editing
	useEffect(() => {
		if (despesa && isEditing) {
			setIsInitialLoad(true);

			// Determine payment type from parcelas
			const tipoPagamentoDetectado = determineTipoPagamento(contasPagar || []);

			form.reset({
				descricao: despesa.descricao,
				valorTotal: despesa.valorTotal,
				dataRegistro: new Date(despesa.dataRegistro),
				fornecedorId: despesa.fornecedorId?.toString() || "",
				categoriaId: despesa.subCategoria?.categoriaId?.toString() || "",
				subCategoriaId: "", // Será preenchido após carregar as subcategorias
				currencyId: despesa.currencyId?.toString() || "",
				cotacao: despesa.cotacao || 0,
				tipoPagamento: tipoPagamentoDetectado,
				valorEntrada: 0,
				numeroParcelas: 1,
				dataPrimeiraParcela: undefined,
				dataVencimento: undefined,
			});

			setSelectedCategoria(despesa.subCategoria?.categoriaId?.toString() || "");
			setValorTotalInput(despesa.valorTotal.toFixed(2).replace(".", ","));
			setCotacaoInput(
				despesa.cotacao ? despesa.cotacao.toFixed(4).replace(".", ",") : ""
			);

			// Set tipoPagamento state based on detected type
			if (tipoPagamentoDetectado === "A_VISTA_IMEDIATA") {
				setTipoPagamento("avista");
			} else if (tipoPagamentoDetectado === "A_PRAZO_SEM_PARCELAS") {
				setTipoPagamento("prazo");
			} else {
				setTipoPagamento("parcelado");
			}
		}
	}, [despesa, isEditing, form, contasPagar]);

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
				valorTotal: data.valorTotal,
				dataRegistro: data.dataRegistro.toISOString(),
				subCategoriaId: Number(data.subCategoriaId),
				parceiroId: Number(selectedPartnerId!),
				tipoPagamento: data.tipoPagamento,
			};

			// Adicionar campos opcionais apenas se tiverem valor
			if (data.fornecedorId) {
				payload.fornecedorId = Number(data.fornecedorId);
			}
			if (data.currencyId) {
				payload.currencyId = Number(data.currencyId);
			}
			if (data.cotacao) {
				payload.cotacao = data.cotacao;
			}

			// Campos específicos para pagamento parcelado
			if (data.tipoPagamento === "PARCELADO") {
				if (data.valorEntrada) {
					payload.valorEntrada = data.valorEntrada;
				}
				if (data.numeroParcelas) {
					payload.numeroParcelas = data.numeroParcelas;
				}
				if (data.dataPrimeiraParcela) {
					payload.dataPrimeiraParcela = data.dataPrimeiraParcela.toISOString();
				}
			}

			// Campo específico para pagamento a prazo sem parcelas
			if (data.tipoPagamento === "A_PRAZO_SEM_PARCELAS") {
				if (data.dataVencimento) {
					payload.dataVencimento = data.dataVencimento.toISOString();
				}
			}

			await createMutation.mutateAsync({
				data: payload,
				headers: { "x-parceiro-id": Number(selectedPartnerId!) },
			});
			toast.success(t("expenses.messages.createSuccess"));

			navigate("/despesas");
		} catch {
			toast.error(t("expenses.messages.createError"));
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
								{isViewing
									? t("expenses.view")
									: isEditing
										? t("expenses.edit")
										: t("expenses.new")}
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
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='descricao'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.description")}</FormLabel>
												<FormControl>
													<Input
														placeholder={t("expenses.descriptionPlaceholder")}
														disabled={isViewing}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='valorTotal'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.totalAmount")}</FormLabel>
												<FormControl>
													<CurrencyInput
														placeholder='0,00'
														value={valorTotalInput}
														decimalsLimit={2}
														decimalSeparator=','
														groupSeparator='.'
														disabled={isViewing}
														onValueChange={(value) => {
															setValorTotalInput(value || "");
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

								{/* Terceira linha: Fornecedor, Data de Registro, Tipo de Pagamento */}
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
														disabled={isLoadingFornecedores || isViewing}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='dataRegistro'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.selectDate")}</FormLabel>
												<FormControl>
													<DatePicker
														date={field.value}
														onDateChange={field.onChange}
														placeholder={t("expenses.selectDate")}
														disabled={isViewing}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='tipoPagamento'
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("expenses.paymentType")}</FormLabel>
												<FormControl>
													<Select
														value={field.value}
														disabled={isViewing}
														onValueChange={(value) => {
															field.onChange(value);
															setTipoPagamento(value);
														}}
													>
														<SelectTrigger>
															<SelectValue
																placeholder={t("expenses.selectPaymentType")}
															/>
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='A_VISTA_IMEDIATA'>
																{t("expenses.cashPayment")}
															</SelectItem>
															<SelectItem value='A_PRAZO_SEM_PARCELAS'>
																{t("expenses.creditPayment")}
															</SelectItem>
															<SelectItem value='PARCELADO'>
																{t("expenses.installmentPayment")}
															</SelectItem>
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Campos condicionais para pagamento parcelado */}
								{tipoPagamento === "PARCELADO" && (
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg'>
										<FormField
											control={form.control}
											name='valorEntrada'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("expenses.entryValue")} ({t("common.optional")})
													</FormLabel>
													<FormControl>
														<CurrencyInput
															placeholder='0,00'
															value={valorEntradaInput}
															decimalsLimit={2}
															decimalSeparator=','
															groupSeparator='.'
															disabled={isViewing}
															onValueChange={(value) => {
																setValorEntradaInput(value || "");
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
											name='numeroParcelas'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("expenses.numberOfInstallments")}
													</FormLabel>
													<FormControl>
														<Input
															type='number'
															min='1'
															max='60'
															placeholder='1'
															disabled={isViewing}
															value={field.value || ""}
															onChange={(e) =>
																field.onChange(parseInt(e.target.value) || 1)
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name='dataPrimeiraParcela'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("expenses.firstInstallmentDate")}
													</FormLabel>
													<FormControl>
														<DatePicker
															date={field.value}
															disabled={isViewing}
															onDateChange={field.onChange}
															placeholder={t(
																"expenses.selectFirstInstallmentDate"
															)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								)}

								{/* Campo condicional para pagamento à prazo sem parcelas */}
								{tipoPagamento === "A_PRAZO_SEM_PARCELAS" && (
									<div className='grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg'>
										<FormField
											control={form.control}
											name='dataVencimento'
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("expenses.dueDate")}</FormLabel>
													<FormControl>
														<DatePicker
															date={field.value}
															disabled={isViewing}
															onDateChange={field.onChange}
															placeholder={t("expenses.selectDueDate")}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								)}

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
														disabled={isLoadingCategorias || isViewing}
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
															isLoadingSubcategorias ||
															!selectedCategoria ||
															isViewing
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Quinta linha: Moeda e Cotação */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='currencyId'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("expenses.currency")} ({t("common.optional")})
												</FormLabel>
												<FormControl>
													{isViewing ? (
														<Input
															value={
																despesa?.currencyId
																	? (() => {
																			const currency = currencies.find(
																				(c) => c.id === despesa.currencyId
																			);
																			return currency
																				? `${currency.isoCode} - ${currency.nome}`
																				: "";
																		})()
																	: ""
															}
															disabled
															placeholder={t("expenses.selectCurrency")}
														/>
													) : (
														<Select
															value={field.value}
															onValueChange={field.onChange}
															disabled={isLoadingCurrencies}
														>
															<SelectTrigger>
																<SelectValue
																	placeholder={t("expenses.selectCurrency")}
																/>
															</SelectTrigger>
															<SelectContent>
																{currencies
																	.filter((currency) => currency.id)
																	.map((currency) => (
																		<SelectItem
																			key={currency.id}
																			value={currency.id!.toString()}
																		>
																			{currency.isoCode} - {currency.nome}
																		</SelectItem>
																	))}
															</SelectContent>
														</Select>
													)}
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
												<FormLabel>
													{t("expenses.exchangeRate")} ({t("common.optional")})
												</FormLabel>
												<FormControl>
													<CurrencyInput
														placeholder='1,000'
														value={cotacaoInput}
														decimalsLimit={3}
														decimalSeparator=','
														groupSeparator='.'
														disabled={isViewing}
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
								</div>

								{/* Tabela de Parcelas - para todas as despesas que possuem contas a pagar */}
								{(isEditing || isViewing) &&
									contasPagar &&
									contasPagar.length > 0 && (
										<div className='mt-6'>
											<TabelaParcelas
												contasPagarId={contasPagar[0].id}
												currency={
													despesa?.currencyId
														? (() => {
																const currency = currencies.find(
																	(c) => c.id === despesa.currencyId
																);
																return currency
																	? {
																			isoCode: currency.isoCode,
																			locale: currency.locale,
																			precision: currency.precision,
																		}
																	: undefined;
															})()
														: undefined
												}
											/>
										</div>
									)}

								<div className='flex justify-end space-x-4'>
									<Button
										type='button'
										variant='outline'
										onClick={() => navigate("/despesas")}
									>
										<X className='mr-2 h-4 w-4' />
										{isViewing ? t("common.close") : t("common.cancel")}
									</Button>
									{!isViewing && (
										<Button
											type='submit'
											disabled={createMutation.isPending}
										>
											{createMutation.isPending ? (
												<>
													<Spinner
														size='sm'
														className='mr-2'
													/>
													{t("common.creating")}
												</>
											) : (
												<>
													<Save className='mr-2 h-4 w-4' />
													{t("common.create")}
												</>
											)}
										</Button>
									)}
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
