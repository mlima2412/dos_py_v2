import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { UseFieldArrayReplace } from "react-hook-form";
import {
	useProdutoControllerFindByLocal,
	useVendaControllerFindOne,
} from "@/api-client";
import { useLocaisEstoque } from "@/hooks/useEstoques";
import type {
	ProdutosPorLocalResponseDto,
	VendaItemEntity,
} from "@/api-client/types";
import type {
	VendaFormMode,
	VendaFormValues,
	VendaItemFormData,
	LocalOption,
} from "../types";

interface UseVendaDataProps {
	mode: VendaFormMode;
	publicId?: string;
	parceiroIdNumber: number | null;
	selectedLocalPublicId: string | null;
	selectedLocalId?: number | null;
	activeStep: string;
	getValues: () => VendaFormValues;
	replace: UseFieldArrayReplace<VendaFormValues, "itens">;
}

export const useVendaData = ({
	mode,
	publicId,
	parceiroIdNumber,
	selectedLocalPublicId: externalSelectedLocalPublicId,
	selectedLocalId,
	activeStep,
	getValues,
	replace,
}: UseVendaDataProps) => {
	const { t } = useTranslation("common");

	const { data: locaisData, isLoading: isLoadingLocais } = useLocaisEstoque({
		parceiroId: parceiroIdNumber ?? undefined,
	});

	const locaisOptions = useMemo<LocalOption[]>(() => {
		return (
			locaisData?.pages
				.flatMap(page => page.data || [])
				.filter(Boolean)
				.map((local: { id: number; publicId?: string; nome?: string }) => ({
					id: local.id,
					publicId: local.publicId ?? String(local.id),
					nome: local.nome ?? t("salesOrders.form.labels.unknownLocation"),
				})) || []
		);
	}, [locaisData?.pages, t]);

	// Calculate selectedLocalPublicId from selectedLocalId if provided
	const selectedLocalPublicId = useMemo(() => {
		if (externalSelectedLocalPublicId) return externalSelectedLocalPublicId;
		if (!selectedLocalId) return null;
		const local = locaisOptions.find(l => l.id === selectedLocalId);
		return local?.publicId ?? null;
	}, [externalSelectedLocalPublicId, selectedLocalId, locaisOptions]);

	const {
		data: produtosData = [],
		isLoading: isLoadingProdutos,
		error: produtosError,
	} = useProdutoControllerFindByLocal(
		selectedLocalPublicId ?? "",
		{
			"x-parceiro-id": parceiroIdNumber ?? 0,
		},
		{
			apenasComEstoque: true,
		},
		{
			query: {
				enabled:
					!!selectedLocalPublicId &&
					!!parceiroIdNumber &&
					activeStep !== "basic",
			},
		}
	);

const produtosDisponiveis = useMemo<ProdutosPorLocalResponseDto[]>(() => {
	return Array.isArray(produtosData) ? produtosData : [];
}, [produtosData]);

const produtosErrorNormalized = useMemo<Error | null>(() => {
	if (!produtosError) return null;
	const message =
		(produtosError.data as { message?: string })?.message ||
		produtosError.statusText ||
		t("common.loadError");
	return new Error(message);
}, [produtosError, t]);

	// Enrich items with product data when available
	useEffect(() => {
		if (!produtosDisponiveis.length) return;
		const currentItens = getValues().itens;
		if (!currentItens || currentItens.length === 0) return;

		let hasChanges = false;
		const enriched = currentItens.map(item => {
			const product = produtosDisponiveis.find(produto =>
				produto.ProdutoSKU?.some(sku => sku.id === item.skuId)
			);
			if (!product) return item;

			const sku = product.ProdutoSKU?.find(s => s.id === item.skuId);
			const productName = product.nome;
			const skuLabel = `${product.id.toString().padStart(3, "0")}-${item.skuId.toString().padStart(3, "0")}`;
			const skuColor = sku?.cor ?? null;
			const skuColorCode = sku?.codCor ? sku.codCor.toString() : null;
			const skuSize = sku?.tamanho ?? null;

			if (
				item.productId !== product.id ||
				item.productName !== productName ||
				item.skuLabel !== skuLabel ||
				item.skuColor !== skuColor ||
				item.skuColorCode !== skuColorCode ||
				item.skuSize !== skuSize
			) {
				hasChanges = true;
				return {
					...item,
					productId: product.id,
					productName,
					skuLabel,
					skuColor,
					skuColorCode,
					skuSize,
				};
			}
			return item;
		});

		if (hasChanges) {
			replace(enriched);
		}
	}, [getValues, produtosDisponiveis, replace]);

	const { data: vendaExistente, isLoading: isLoadingVenda } =
		useVendaControllerFindOne(
			publicId ?? "",
			{ "x-parceiro-id": parceiroIdNumber ?? 0 },
			{
				query: {
					enabled: mode !== "create" && !!publicId && !!parceiroIdNumber,
				},
			}
		);

type VendaItemWithProduto = VendaItemEntity & {
	produtoId?: number;
	produtoNome?: string;
};

	const mapVendaItemToFormData = useCallback(
		(item: VendaItemWithProduto): VendaItemFormData => ({
			remoteId: item.id,
			skuId: item.skuId,
			productId: item.produtoId ?? 0,
			qtdReservada: item.qtdReservada,
			qtdDevolvida: item.qtdDevolvida ?? 0,
			qtdAceita: item.qtdAceita ?? item.qtdReservada,
			precoUnit: item.precoUnit,
			desconto: item.desconto ?? 0,
			descontoTipo: (item.descontoTipo as "VALOR" | "PERCENTUAL") ?? "VALOR",
			descontoValor: item.descontoValor ?? 0,
			observacao: "",
			tipo: item.tipo,
			productName:
				item.produtoNome || t("salesOrders.form.labels.unknownProduct"),
			skuLabel: item.skuPublicId || item.skuId.toString().padStart(3, "0"),
			skuColor: item.skuCor ?? null,
			skuColorCode: item.skuCodCor ?? null,
			skuSize: item.skuTamanho ?? null,
		}),
		[t]
	);

	return {
		locaisOptions,
		isLoadingLocais,
		produtosDisponiveis,
		isLoadingProdutos,
		produtosError: produtosErrorNormalized,
		vendaExistente,
		isLoadingVenda,
		mapVendaItemToFormData,
	};
};
