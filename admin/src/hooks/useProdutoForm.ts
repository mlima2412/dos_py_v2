import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/useToast";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	PRODUTO_FORM_DEFAULTS,
	PRODUTO_FORM_TIMEOUTS,
} from "@/constants/produtoConstants";
import {
	ProdutoFormData,
	transformProdutoToForm,
	transformFormToCreateProduto,
	transformFormToUpdateProduto,
} from "@/pages/produtos/produtoTransformers";
import {
	useProdutoControllerCreate,
	useProdutoControllerUpdate,
} from "@/api-client";
import { Produto } from "@/api-client";

// Função para criar schema com traduções
const createFormSchema = (t: (key: string) => string) =>
	import("zod").then(({ z }) =>
		z.object({
			nome: z
				.string()
				.min(1, t("products.validations.nameRequired"))
				.min(2, t("products.validations.nameMinLength"))
				.max(255, t("products.validations.nameMaxLength")),
			descricao: z.string().optional(),
			categoriaId: z.string().optional(),
			fornecedorId: z.string().optional(),
			currencyId: z.string().optional(),
			precoCompra: z
				.number()
				.min(0.01, t("products.validations.purchasePriceMin")),
			precoVenda: z.number().min(0.01, t("products.validations.salePriceMin")),
			ativo: z.boolean(),
			consignado: z.boolean(),
			imgURL: z
				.string()
				.url(t("products.validations.imageUrlInvalid"))
				.optional()
				.or(z.literal("")),
		})
	);

interface UseProdutoFormProps {
	produto?: Produto;
	isEditing: boolean;
	categorias: any[];
	fornecedores: any[];
	currencies: any[];
}

export const useProdutoForm = ({
	produto,
	isEditing,
	categorias,
	fornecedores,
	currencies,
}: UseProdutoFormProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const { selectedPartnerId } = usePartnerContext();
	const toast = useToast();

	const [precoCompraInput, setPrecoCompraInput] = useState<string>("");
	const [precoVendaInput, setPrecoVendaInput] = useState<string>("");

	const [formSchema, setFormSchema] = useState<any>(null);

	// Criar schema com traduções
	useEffect(() => {
		createFormSchema(t).then(setFormSchema);
	}, [t]);

	const form = useForm<ProdutoFormData>({
		resolver: formSchema ? zodResolver(formSchema) : undefined,
		defaultValues: PRODUTO_FORM_DEFAULTS,
	});

	const { reset, setValue } = form;

	// Mutations
	const createMutation = useProdutoControllerCreate();
	const updateMutation = useProdutoControllerUpdate();

	// Populate form when editing
	useEffect(() => {
		if (produto && isEditing) {
			const formData = transformProdutoToForm(produto);
			reset(formData);

			setPrecoCompraInput(produto.precoCompra.toFixed(2).replace(".", ","));
			setPrecoVendaInput(produto.precoVenda.toFixed(2).replace(".", ","));
		}
	}, [produto, isEditing, reset]);

	// Force update category selection when categories load
	useEffect(() => {
		if (produto && categorias.length > 0 && isEditing) {
			const categoriaId = produto.categoriaId
				? String(produto.categoriaId)
				: "";
			if (categoriaId) {
				setTimeout(() => {
					setValue("categoriaId", categoriaId, { shouldValidate: true });
				}, PRODUTO_FORM_TIMEOUTS.selectUpdate);
			}
		}
	}, [produto, categorias, isEditing, setValue]);

	// Force update supplier selection when suppliers load
	useEffect(() => {
		if (produto && fornecedores.length > 0 && isEditing) {
			const fornecedorId = produto.fornecedorId
				? String(produto.fornecedorId)
				: "";
			if (fornecedorId) {
				setTimeout(() => {
					setValue("fornecedorId", fornecedorId, { shouldValidate: true });
				}, PRODUTO_FORM_TIMEOUTS.selectUpdate);
			}
		}
	}, [produto, fornecedores, isEditing, setValue]);

	// Force update currency selection when currencies load
	useEffect(() => {
		if (produto && currencies.length > 0 && isEditing) {
			const currencyId = produto.currencyId ? String(produto.currencyId) : "";
			if (currencyId) {
				setTimeout(() => {
					setValue("currencyId", currencyId, { shouldValidate: true });
				}, PRODUTO_FORM_TIMEOUTS.selectUpdate);
			}
		}
	}, [produto, currencies, isEditing, setValue]);

	const onSubmit = useCallback(
		async (data: ProdutoFormData) => {
			if (!selectedPartnerId) {
				toast.error(t("products.messages.noPartnerSelected"));
				return;
			}

			try {
				let produtoId: string;

				if (isEditing) {
					const payload = transformFormToUpdateProduto(data);
					await updateMutation.mutateAsync({
						publicId: id!,
						headers: { "x-parceiro-id": Number(selectedPartnerId!) },
						data: payload,
					});

					// Invalidar queries para recarregar os dados atualizados
					queryClient.invalidateQueries({
						queryKey: [{ url: "/produto/:publicId", params: { publicId: id } }],
					});

					// Invalidar também queries de produtos em geral
					queryClient.invalidateQueries({
						queryKey: [{ url: "/produto" }],
					});

					toast.success(t("products.messages.updateSuccess"));
					produtoId = id!;
				} else {
					const payload = transformFormToCreateProduto(data);
					const response = await createMutation.mutateAsync({
						data: payload,
						headers: { "x-parceiro-id": Number(selectedPartnerId!) },
					});
					toast.success(t("products.messages.createSuccess"));
					produtoId = response.publicId;
				}

				// Redirecionar para o modo de visualização
				navigate(`/produtos/visualizar/${produtoId}`);
			} catch (error) {
				console.error("Erro ao salvar produto:", error);
				toast.error(
					isEditing
						? t("products.messages.updateError")
						: t("products.messages.createError")
				);
			}
		},
		[
			isEditing,
			id,
			selectedPartnerId,
			updateMutation,
			createMutation,
			queryClient,
			toast,
			t,
			navigate,
		]
	);

	return {
		form,
		onSubmit,
		isSubmitting:
			form.formState.isSubmitting ||
			createMutation.isPending ||
			updateMutation.isPending,
		precoCompraInput,
		setPrecoCompraInput,
		precoVendaInput,
		setPrecoVendaInput,
	};
};
