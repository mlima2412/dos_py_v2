import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useProdutoControllerFindOne,
	useCategoriaProdutoControllerFindAll,
	useFornecedoresControllerFindAll,
	useCurrencyControllerFindAll,
	useProdutoSkuControllerFindByProduto,
} from "@/api-client";

export const useProdutoData = (id?: string, isEditing: boolean = false) => {
	const { selectedPartnerId } = usePartnerContext();

	const { data: produto, isLoading: isLoadingProduto } =
		useProdutoControllerFindOne(
			id!,
			{ "x-parceiro-id": Number(selectedPartnerId!) },
			{ query: { enabled: isEditing && Boolean(selectedPartnerId) } }
		);

	const { data: categorias = [], isLoading: isLoadingCategorias } =
		useCategoriaProdutoControllerFindAll();

	const { data: fornecedores = [], isLoading: isLoadingFornecedores } =
		useFornecedoresControllerFindAll(Number(selectedPartnerId!), {
			query: {
				enabled: Boolean(selectedPartnerId),
			},
		});

	const { data: currencies = [], isLoading: isLoadingCurrencies } =
		useCurrencyControllerFindAll();

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

	return {
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
	};
};
