import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import CurrencyInput from "react-currency-input-field";
import { Save, X, Plus, Edit } from "lucide-react";

import { useToast } from "@/hooks/useToast";
import { usePartnerContext } from "@/hooks/usePartnerContext";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
	useProdutoControllerCreate,
	useProdutoControllerFindOne,
	useProdutoControllerUpdate,
	useCategoriaProdutoControllerFindAll,
	useProdutoSkuControllerFindByProduto,
	useProdutoSkuControllerCreate,
	useProdutoSkuControllerUpdate,
	useProdutoSkuControllerRemove,
	type CreateProdutoDto,
	type UpdateProdutoDto,
	type CreateProdutoSkuDto,
	type UpdateProdutoSkuDto,
} from "@/api-client";

import { TabelaSkus } from "./components/TabelaSkus";
import { DialogSku } from "./components/DialogSku";

// Função para criar schema com traduções
const createFormSchema = (t: (key: string) => string) =>
	z.object({
		nome: z
			.string()
			.min(1, t("products.validations.nameRequired"))
			.min(2, t("products.validations.nameMinLength"))
			.max(255, t("products.validations.nameMaxLength")),
		descricao: z.string().optional(),
		categoriaId: z.string().optional(),
		precoCompra: z
			.number()
			.min(0.01, t("products.validations.purchasePriceMin")),
		precoVenda: z.number().min(0.01, t("products.validations.salePriceMin")),
		ativo: z.boolean().default(true),
		consignado: z.boolean().default(false),
		imgURL: z
			.string()
			.url(t("products.validations.imageUrlInvalid"))
			.optional()
			.or(z.literal("")),
	});

export function FormularioProduto() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartnerContext();
	const isEditing = Boolean(id);
	const isViewing = location.pathname.includes("/visualizar/");

	const [precoCompraInput, setPrecoCompraInput] = useState<string>("");
	const [precoVendaInput, setPrecoVendaInput] = useState<string>("");
	const [isSkuDialogOpen, setIsSkuDialogOpen] = useState(false);
	const [editingSku, setEditingSku] = useState<any>(null);
	const [deleteSkuId, setDeleteSkuId] = useState<string | null>(null);

	// Criar schema com traduções
	const formSchema = createFormSchema(t);
	type FormData = z.infer<typeof formSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			nome: "",
			descricao: "",
			categoriaId: "",
			precoCompra: 0,
			precoVenda: 0,
			ativo: true,
			consignado: false,
			imgURL: "",
		},
	});

	// Queries
	const { data: produto, isLoading: isLoadingProduto } =
		useProdutoControllerFindOne(
			id!,
			{ "x-parceiro-id": Number(selectedPartnerId!) },
			{ query: { enabled: isEditing && Boolean(selectedPartnerId) } }
		);

	const { data: categorias = [], isLoading: isLoadingCategorias } =
		useCategoriaProdutoControllerFindAll();

	const { data: skus = [], isLoading: isLoadingSkus } =
		useProdutoSkuControllerFindByProduto(
			produto?.publicId || "",
			{ "x-parceiro-id": Number(selectedPartnerId!) },
			{
				query: {
					enabled: Boolean(produto?.publicId) && Boolean(selectedPartnerId),
				},
			}
		);

	// Mutations
	const createMutation = useProdutoControllerCreate();
	const updateMutation = useProdutoControllerUpdate();
	const createSkuMutation = useProdutoSkuControllerCreate();
	const updateSkuMutation = useProdutoSkuControllerUpdate();
	const deleteSkuMutation = useProdutoSkuControllerRemove();

	// Populate form when editing
	useEffect(() => {
		if (produto && isEditing) {
			form.reset({
				nome: produto.nome,
				descricao: produto.descricao || "",
				categoriaId: produto.categoriaId?.toString() || "",
				precoCompra: produto.precoCompra,
				precoVenda: produto.precoVenda,
				ativo: produto.ativo,
				consignado: produto.consignado,
				imgURL: produto.imgURL || "",
			});

			setPrecoCompraInput(produto.precoCompra.toFixed(2).replace(".", ","));
			setPrecoVendaInput(produto.precoVenda.toFixed(2).replace(".", ","));
		}
	}, [produto, isEditing, form]);

	const toast = useToast();

	const onSubmit = async (data: FormData) => {
		if (!selectedPartnerId) {
			toast.error(t("products.messages.noPartnerSelected"));
			return;
		}

		try {
			const payload: CreateProdutoDto | UpdateProdutoDto = {
				nome: data.nome,
				descricao: data.descricao || undefined,
				categoriaId: data.categoriaId ? Number(data.categoriaId) : undefined,
				precoCompra: data.precoCompra,
				precoVenda: data.precoVenda,
				ativo: data.ativo,
				consignado: data.consignado,
				imgURL: data.imgURL || undefined,
			};

			let produtoId: string;

			if (isEditing) {
				await updateMutation.mutateAsync({
					publicId: id!,
					headers: { "x-parceiro-id": Number(selectedPartnerId!) },
					data: payload as UpdateProdutoDto,
				});
				toast.success(t("products.messages.updateSuccess"));
				produtoId = id!;
			} else {
				const response = await createMutation.mutateAsync({
					data: payload as CreateProdutoDto,
					headers: { "x-parceiro-id": Number(selectedPartnerId!) },
				});
				toast.success(t("products.messages.createSuccess"));
				produtoId = response.publicId;
			}

			// Redirecionar para o modo de visualização
			navigate(`/produtos/visualizar/${produtoId}`);
		} catch {
			toast.error(
				isEditing
					? t("products.messages.updateError")
					: t("products.messages.createError")
			);
		}
	};

	const handleCreateSku = async (skuData: any) => {
		if (!selectedPartnerId || !produto?.publicId) return;

		try {
			const payload: CreateProdutoSkuDto = {
				produtoId: produto.id,
				cor: skuData.cor || undefined,
				tamanho: skuData.tamanho || undefined,
				qtdMinima: skuData.qtdMinima || 0,
			};

			await createSkuMutation.mutateAsync({
				data: payload,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
			});

			// Invalidar todas as queries de SKUs para atualizar a lista
			queryClient.invalidateQueries({
				queryKey: [{ url: "/produto-sku/produto/:produtoPublicId" }],
			});

			toast.success(t("products.skus.messages.createSuccess"));
			// Limpar o formulário para permitir criar outro SKU
			// O dialog permanece aberto
		} catch {
			toast.error(t("products.skus.messages.createError"));
		}
	};

	const handleUpdateSku = async (skuData: any) => {
		if (!selectedPartnerId || !editingSku) return;

		try {
			const payload: UpdateProdutoSkuDto = {
				cor: skuData.cor || undefined,
				tamanho: skuData.tamanho || undefined,
				qtdMinima: skuData.qtdMinima || 0,
			};

			await updateSkuMutation.mutateAsync({
				publicId: editingSku.publicId,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
				data: payload,
			});

			// Invalidar todas as queries de SKUs para atualizar a lista
			queryClient.invalidateQueries({
				queryKey: [{ url: "/produto-sku/produto/:produtoPublicId" }],
			});

			toast.success(t("products.skus.messages.updateSuccess"));
			// Não fechar o dialog - manter aberto para editar mais SKUs
			setEditingSku(null);
		} catch {
			toast.error(t("products.skus.messages.updateError"));
		}
	};

	const handleDeleteSku = async () => {
		if (!selectedPartnerId || !deleteSkuId) return;

		try {
			await deleteSkuMutation.mutateAsync({
				publicId: deleteSkuId,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
			});

			// Invalidar todas as queries de SKUs para atualizar a lista
			queryClient.invalidateQueries({
				queryKey: [{ url: "/produto-sku/produto/:produtoPublicId" }],
			});

			toast.success(t("products.skus.messages.deleteSuccess"));
			setDeleteSkuId(null);
		} catch {
			toast.error(t("products.skus.messages.deleteError"));
		}
	};

	const handleEditSku = (sku: any) => {
		setEditingSku(sku);
		setIsSkuDialogOpen(true);
	};

	const handleColorChange = async (skuId: string, codCor: string) => {
		if (!selectedPartnerId) return;

		try {
			await updateSkuMutation.mutateAsync({
				publicId: skuId,
				headers: { "x-parceiro-id": Number(selectedPartnerId) },
				data: { codCor },
			});

			// Invalidar todas as queries de SKUs para atualizar a lista
			queryClient.invalidateQueries({
				queryKey: [{ url: "/produto-sku/produto/:produtoPublicId" }],
			});

			toast.success(t("products.skus.messages.colorUpdated"));
		} catch {
			toast.error(t("products.skus.messages.colorUpdateError"));
		}
	};

	const handleDeleteSkuClick = (skuId: string) => {
		setDeleteSkuId(skuId);
	};

	// Prepare options for selects
	const categoriaOptions = categorias.map(categoria => ({
		value: categoria.id.toString(),
		label: categoria.descricao,
	}));

	if (isLoadingProduto && isEditing) {
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
			<div className="space-y-6 h-full flex flex-col">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/produtos">
								{t("products.title")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{isViewing
									? t("products.view")
									: isEditing
										? t("products.edit")
										: t("products.new")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Header resumido para visualização */}
				{isViewing && produto && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<div>
									<h1 className="text-2xl font-bold">{produto.nome}</h1>
									<p className="text-lg text-muted-foreground">
										{selectedPartnerLocale === "pt-BR" ? "R$" : "₲"}{" "}
										{produto.precoVenda.toLocaleString(
											selectedPartnerLocale || "pt-BR",
											{
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											}
										)}
									</p>
								</div>
								<div className="flex items-center space-x-4">
									{/* Imagem do produto */}
									<div className="w-16 h-16 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
										{produto.imgURL ? (
											<img
												src={produto.imgURL}
												alt={produto.nome}
												className="w-full h-full object-cover"
											/>
										) : (
											<Edit className="h-8 w-8 text-gray-400" />
										)}
									</div>
								</div>
							</CardTitle>
						</CardHeader>
					</Card>
				)}

				{/* Formulário completo - apenas para criação e edição */}
				{!isViewing && (
					<Card>
						<CardContent className="pt-6">
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-6"
								>
									{/* Linha 1: Nome, Ativo, Consignado */}
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<FormField
											control={form.control}
											name="nome"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("products.name")}</FormLabel>
													<FormControl>
														<Input
															placeholder={t("products.placeholders.name")}
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
											name="ativo"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">
															{t("products.active")}
														</FormLabel>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
															disabled={isViewing}
														/>
													</FormControl>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="consignado"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">
															{t("products.consigned")}
														</FormLabel>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
															disabled={isViewing}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</div>

									{/* Linha 2: Descrição e Categoria */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="descricao"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("products.description")} ({t("common.optional")})
													</FormLabel>
													<FormControl>
														<Textarea
															placeholder={t(
																"products.placeholders.description"
															)}
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
											name="categoriaId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("products.category")} ({t("common.optional")})
													</FormLabel>
													<FormControl>
														<Select
															value={field.value}
															onValueChange={field.onChange}
															disabled={isLoadingCategorias || isViewing}
														>
															<SelectTrigger>
																<SelectValue
																	placeholder={t(
																		"products.placeholders.categoryFilter"
																	)}
																/>
															</SelectTrigger>
															<SelectContent>
																{categoriaOptions.map(categoria => (
																	<SelectItem
																		key={categoria.value}
																		value={categoria.value}
																	>
																		{categoria.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Linha 3: Preço de Compra e Preço de Venda */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="precoCompra"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("products.purchasePrice")}</FormLabel>
													<FormControl>
														<CurrencyInput
															placeholder={t(
																"products.placeholders.purchasePrice"
															)}
															value={precoCompraInput}
															decimalsLimit={2}
															decimalSeparator=","
															groupSeparator="."
															disabled={true}
															onValueChange={value => {
																setPrecoCompraInput(value || "");
																field.onChange(
																	parseFloat(value?.replace(",", ".") || "0")
																);
															}}
															className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="precoVenda"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("products.salePrice")}</FormLabel>
													<FormControl>
														<CurrencyInput
															placeholder={t("products.placeholders.salePrice")}
															value={precoVendaInput}
															decimalsLimit={2}
															decimalSeparator=","
															groupSeparator="."
															disabled={isViewing}
															onValueChange={value => {
																setPrecoVendaInput(value || "");
																field.onChange(
																	parseFloat(value?.replace(",", ".") || "0")
																);
															}}
															className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Botões de ação */}
									<div className="flex justify-end space-x-4">
										<Button
											type="button"
											variant="outline"
											onClick={() => navigate("/produtos")}
										>
											<X className="mr-2 h-4 w-4" />
											{isViewing ? t("common.close") : t("common.cancel")}
										</Button>
										{!isViewing && (
											<Button
												type="submit"
												disabled={
													createMutation.isPending || updateMutation.isPending
												}
											>
												{createMutation.isPending ||
												updateMutation.isPending ? (
													<>
														<Spinner size="sm" className="mr-2" />
														{isEditing
															? t("common.updating")
															: t("common.creating")}
													</>
												) : (
													<>
														<Save className="mr-2 h-4 w-4" />
														{isEditing
															? t("common.update")
															: t("common.create")}
													</>
												)}
											</Button>
										)}
									</div>
								</form>
							</Form>
						</CardContent>
					</Card>
				)}

				{/* Tabela de SKUs - apenas para visualização */}
				{isViewing && (
					<div className="mt-6 flex-1 flex flex-col min-h-0">
						<TabelaSkus
							skus={skus}
							isLoading={isLoadingSkus}
							onEdit={handleEditSku}
							onDelete={handleDeleteSkuClick}
							onColorChange={handleColorChange}
							onCreateSku={handleCreateSku}
							produto={produto}
						/>
					</div>
				)}

				{/* Dialog de confirmação para excluir SKU */}
				<AlertDialog
					open={Boolean(deleteSkuId)}
					onOpenChange={() => setDeleteSkuId(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{t("products.skus.messages.deleteConfirmTitle")}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{t("products.skus.messages.deleteConfirmDescription")}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								{t("products.skus.messages.deleteConfirmCancel")}
							</AlertDialogCancel>
							<AlertDialogAction onClick={handleDeleteSku}>
								{t("products.skus.messages.deleteConfirmConfirm")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</DashboardLayout>
	);
}
