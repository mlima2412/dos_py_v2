import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import CurrencyInput from "react-currency-input-field";
import { Save, X, Edit } from "lucide-react";

import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useProdutoData } from "@/hooks/useProdutoData";
import { useProdutoForm } from "@/hooks/useProdutoForm";

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Dialog } from "@/components/ui/dialog";
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
	useProdutoSkuControllerCreate,
	useProdutoSkuControllerUpdate,
	useProdutoSkuControllerRemove,
	type CreateProdutoSkuDto,
	type UpdateProdutoSkuDto,
} from "@/api-client";

import { TabelaSkus } from "./components/TabelaSkus";
import { DialogSku } from "./components/DialogSku";
import { PRODUTO_FORM_GRID_CLASSES } from "@/constants/produtoConstants";

export function FormularioProduto() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const { selectedPartnerId, selectedPartnerLocale } = usePartnerContext();
	const isEditing = Boolean(id);
	const isViewing = location.pathname.includes("/visualizar/");

	const [isSkuDialogOpen, setIsSkuDialogOpen] = useState(false);
	const [editingSku, setEditingSku] = useState<{
		id: number;
		publicId: string;
		cor?: string;
		tamanho?: string;
		qtdMinima: number;
		codCor?: string;
	} | null>(null);
	const [deleteSkuId, setDeleteSkuId] = useState<string | null>(null);

	// Hooks customizados
	const {
		produto,
		categorias,
		fornecedores,
		currencies,
		skus,
		isLoadingProduto,
		isLoadingCategorias,
		isLoadingFornecedores,
		isLoadingCurrencies,
		isLoadingSkus,
	} = useProdutoData(id, isEditing);

	const {
		form,
		onSubmit,
		isSubmitting,
		precoCompraInput,
		setPrecoCompraInput,
		precoVendaInput,
		setPrecoVendaInput,
	} = useProdutoForm({
		produto,
		isEditing,
		categorias,
		fornecedores,
		currencies,
	});

	// Mutations para SKUs
	const createSkuMutation = useProdutoSkuControllerCreate();
	const updateSkuMutation = useProdutoSkuControllerUpdate();
	const deleteSkuMutation = useProdutoSkuControllerRemove();

	const handleCreateSku = async (skuData: {
		cor: string;
		tamanho: string;
		qtdMinima: number;
		codCor?: string;
	}) => {
		if (!selectedPartnerId || !produto?.publicId) return;

		try {
			const payload: CreateProdutoSkuDto = {
				id: produto.id,
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

			// Limpar o formulário para permitir criar outro SKU
			// O dialog permanece aberto
		} catch (error) {
			console.error("Erro ao criar SKU:", error);
		}
	};

	const handleUpdateSku = async (skuData: {
		cor: string;
		tamanho: string;
		qtdMinima: number;
		codCor?: string;
	}) => {
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

			// Fechar o dialog após editar
			setEditingSku(null);
			setIsSkuDialogOpen(false);
		} catch (error) {
			console.error("Erro ao atualizar SKU:", error);
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

			setDeleteSkuId(null);
		} catch (error) {
			console.error("Erro ao deletar SKU:", error);
		}
	};

	const handleEditSku = (sku: {
		id: number;
		publicId: string;
		cor?: string;
		tamanho?: string;
		qtdMinima: number;
		codCor?: string;
	}) => {
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
		} catch (error) {
			console.error("Erro ao atualizar cor do SKU:", error);
		}
	};

	const handleDeleteSkuClick = (skuId: string) => {
		setDeleteSkuId(skuId);
	};

	// Prepare options for selects
	const categoriaOptions = categorias.map(categoria => ({
		value: categoria.id?.toString() || "",
		label: categoria.descricao,
	}));

	const fornecedorOptions = fornecedores.map(fornecedor => ({
		value: fornecedor.id?.toString() || "",
		label: fornecedor.nome,
	}));

	const currencyOptions = currencies.map(currency => ({
		value: currency.id?.toString() || "",
		label: `${currency.isoCode} - ${currency.nome}`,
	}));

	if (isLoadingProduto && isEditing) {
		return (
			
				<div className="flex items-center justify-center h-64">
					<Spinner size="lg" />
				</div>
			
		);
	}

	return (
		
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
									<div className={PRODUTO_FORM_GRID_CLASSES.row}>
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
									<div className={PRODUTO_FORM_GRID_CLASSES.row2}>
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

									{/* Linha 3: Fornecedor e Currency */}
									<div className={PRODUTO_FORM_GRID_CLASSES.row2}>
										<FormField
											control={form.control}
											name="fornecedorId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("products.supplier")} ({t("common.optional")})
													</FormLabel>
													<FormControl>
														<Select
															value={field.value}
															onValueChange={field.onChange}
															disabled={isLoadingFornecedores || isViewing}
														>
															<SelectTrigger>
																<SelectValue
																	placeholder={t(
																		"products.placeholders.supplier"
																	)}
																/>
															</SelectTrigger>
															<SelectContent>
																{fornecedorOptions.map(fornecedor => (
																	<SelectItem
																		key={fornecedor.value}
																		value={fornecedor.value}
																	>
																		{fornecedor.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="currencyId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("products.currency")} ({t("common.optional")})
													</FormLabel>
													<FormControl>
														<Select
															value={field.value}
															onValueChange={field.onChange}
															disabled={isLoadingCurrencies || isViewing}
														>
															<SelectTrigger>
																<SelectValue
																	placeholder={t(
																		"products.placeholders.currency"
																	)}
																/>
															</SelectTrigger>
															<SelectContent>
																{currencyOptions.map(currency => (
																	<SelectItem
																		key={currency.value}
																		value={currency.value}
																	>
																		{currency.label}
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

									{/* Linha 4: Preço de Compra e Preço de Venda */}
									<div className={PRODUTO_FORM_GRID_CLASSES.row2}>
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
											<Button type="submit" disabled={isSubmitting}>
												{isSubmitting ? (
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
				{isViewing && produto && (
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

				{/* Dialog para editar SKU */}
				<Dialog open={isSkuDialogOpen} onOpenChange={setIsSkuDialogOpen}>
					<DialogSku
						onSubmit={handleCreateSku}
						onClose={() => {
							setIsSkuDialogOpen(false);
							setEditingSku(null);
						}}
						editingSku={
							editingSku
								? {
										cor: editingSku.cor || "",
										tamanho: editingSku.tamanho || "",
										qtdMinima: editingSku.qtdMinima,
										codCor: editingSku.codCor,
									}
								: undefined
						}
						onUpdate={handleUpdateSku}
					/>
				</Dialog>

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
		
	);
}
