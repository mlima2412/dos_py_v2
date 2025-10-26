import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
	UseFieldArrayAppend,
	UseFieldArrayUpdate,
	UseFieldArrayRemove,
} from "react-hook-form";
import { useToast } from "@/hooks/useToast";
import {
	useVendaControllerCreate,
	useVendaControllerUpdate,
	useVendaItemControllerCreate,
	useVendaItemControllerUpdate,
	useVendaItemControllerRemove,
	estoqueSkuControllerFindOne,
} from "@/api-client";
import type {
	ProdutoSKUEstoqueResponseDto,
	ProdutosPorLocalResponseDto,
	VendaTipoEnum,
} from "@/api-client/types";
import type {
	VendaFormMode,
	VendaFormValues,
	VendaItemFormData,
	VendaSummary,
} from "../types";

interface EstoqueSkuData {
	publicId?: string;
	cor?: string;
	tamanho?: string;
	codCor?: number;
	qtdMinima?: number;
	produto?: {
		id?: number;
		publicId?: string;
		nome?: string;
		precoVenda?: number;
		precoCompra?: number;
		ativo?: boolean;
		consignado?: boolean;
	};
}

interface UseVendaMutationsProps {
	mode: VendaFormMode;
	parceiroIdNumber: number | null;
	vendaResumo: VendaSummary | undefined;
	setVendaResumo: (
		resumo: VendaSummary | ((prev: VendaSummary | undefined) => VendaSummary)
	) => void;
	itensSelecionados: VendaItemFormData[];
	append: UseFieldArrayAppend<VendaFormValues, "itens">;
	update: UseFieldArrayUpdate<VendaFormValues, "itens">;
	remove: UseFieldArrayRemove;
	produtosDisponiveis: ProdutosPorLocalResponseDto[];
	selectedLocalId: number | null;
	setSelectedProductId: (id: number | null) => void;
	skuSearchCode: string;
	setSkuSearchCode: (code: string) => void;
	skuListingRef: React.RefObject<any | null>;
	selectedSkusRef: React.RefObject<any | null>;
}

export const useVendaMutations = ({
	mode,
	parceiroIdNumber,
	vendaResumo,
	setVendaResumo,
	itensSelecionados,
	append,
	update,
	remove,
	produtosDisponiveis,
	selectedLocalId,
	setSelectedProductId,
	skuSearchCode,
	setSkuSearchCode,
	skuListingRef,
	selectedSkusRef,
}: UseVendaMutationsProps) => {
	const { t } = useTranslation("common");
	const { error: showError } = useToast();

	const vendaCreateMutation = useVendaControllerCreate({
		mutation: {
			onSuccess: data => {
				setVendaResumo({
					id: data.id,
					publicId: data.publicId,
					status: data.status,
					clienteNome: data.clienteNome,
				});
			},
		},
	});

	const vendaUpdateMutation = useVendaControllerUpdate();
	const vendaItemCreateMutation = useVendaItemControllerCreate();
	const vendaItemUpdateMutation = useVendaItemControllerUpdate();
	const vendaItemRemoveMutation = useVendaItemControllerRemove();

	const handleCreateOrUpdateVenda = useCallback(
		async (payload: {
			clienteId: number;
			localSaidaId: number;
			tipo: VendaTipoEnum;
			dataEntrega?: Date | null;
			observacao?: string | null;
			valorFrete?: number | null;
			descontoTotal?: number | null;
			comissao?: number | null;
			numeroFatura?: string | null;
			nomeFatura?: string | null;
			ruccnpjFatura?: string | null;
		}) => {
			if (!parceiroIdNumber) {
				showError(t("salesOrders.form.messages.partnerRequired"));
				return null;
			}

			const dto = {
				clienteId: payload.clienteId,
				localSaidaId: payload.localSaidaId,
				tipo: payload.tipo,
				dataEntrega: payload.dataEntrega
					? payload.dataEntrega.toISOString()
					: undefined,
				observacao: payload.observacao || undefined,
				valorFrete: payload.valorFrete ?? undefined,
				desconto: payload.descontoTotal ?? undefined,
				valorComissao: payload.comissao ?? undefined,
				numeroFatura: payload.numeroFatura || undefined,
				nomeFatura: payload.nomeFatura || undefined,
				ruccnpj: payload.ruccnpjFatura || undefined,
			};

			if (mode === "create" || !vendaResumo?.publicId) {
				const result = await vendaCreateMutation.mutateAsync({
					data: dto,
					headers: { "x-parceiro-id": parceiroIdNumber },
				});
				setVendaResumo({
					id: result.id,
					publicId: result.publicId,
					status: result.status,
					clienteId: result.clienteId,
					clienteNome: result.clienteNome,
					clienteSobrenome: result.clienteSobrenome,
				});
				return result;
			}

			const updated = await vendaUpdateMutation.mutateAsync({
				publicId: vendaResumo.publicId,
				headers: { "x-parceiro-id": parceiroIdNumber },
				data: dto,
			});
			setVendaResumo(prev => ({
				...prev,
				status: updated.status,
				clienteId: updated.clienteId ?? prev?.clienteId,
				clienteNome: updated.clienteNome ?? prev?.clienteNome,
				clienteSobrenome: updated.clienteSobrenome ?? prev?.clienteSobrenome,
			}));
			return updated;
		},
		[
			mode,
			parceiroIdNumber,
			showError,
			t,
			vendaCreateMutation,
			vendaResumo?.publicId,
			vendaUpdateMutation,
			setVendaResumo,
		]
	);

	const handleAddSku = useCallback(
		async (
			sku: ProdutoSKUEstoqueResponseDto,
			product: ProdutosPorLocalResponseDto,
			discount: number = 0
		): Promise<boolean> => {
			if (mode === "view") return false;
			if (!vendaResumo?.id || !parceiroIdNumber) {
				showError(t("salesOrders.form.messages.saveBasicFirst"));
				return false;
			}

			const skuLabel = `${product.id.toString().padStart(3, "0")}-${sku.id
				.toString()
				.padStart(3, "0")}`;
			const existingIndex = itensSelecionados.findIndex(
				item => item.skuId === sku.id
			);

			if (existingIndex >= 0) {
				const current = itensSelecionados[existingIndex];
				const newQuantity = current.qtdReservada + 1;

				try {
					if (current.remoteId) {
						await vendaItemUpdateMutation.mutateAsync({
							id: String(current.remoteId),
							params: { vendaId: String(vendaResumo.id) },
							headers: { "x-parceiro-id": parceiroIdNumber },
							data: {
								qtdReservada: newQuantity,
								precoUnit: Number(current.precoUnit),
								desconto: Number(current.desconto ?? 0),
							},
						});
					} else {
						const created = await vendaItemCreateMutation.mutateAsync({
							data: {
								vendaId: vendaResumo.id,
								skuId: sku.id,
								qtdReservada: newQuantity,
								precoUnit: Number(current.precoUnit),
								desconto: Number(current.desconto ?? 0),
								tipo: current.tipo ?? "NORMAL",
							},
							headers: { "x-parceiro-id": parceiroIdNumber },
						});
						update(existingIndex, {
							...current,
							remoteId: created.id,
						});
					}

					update(existingIndex, {
						...current,
						qtdReservada: newQuantity,
						productId: product.id,
						productName: product.nome,
						skuLabel,
						skuColor: sku.cor ?? null,
						skuColorCode: sku.codCor ? sku.codCor.toString() : null,
						skuSize: sku.tamanho ?? null,
					});
					return true;
				} catch (error) {
					console.error(error);
					showError(t("salesOrders.form.messages.itemsSaveError"));
					return false;
				}
			}

			try {
				const created = await vendaItemCreateMutation.mutateAsync({
					data: {
						vendaId: vendaResumo.id,
						skuId: sku.id,
						qtdReservada: 1,
						precoUnit: Number(product.precoVenda ?? 0),
						desconto: Number(discount),
						tipo: "NORMAL",
					},
					headers: { "x-parceiro-id": parceiroIdNumber },
				});

				append({
					remoteId: created.id,
					skuId: sku.id,
					productId: product.id,
					qtdReservada: created.qtdReservada ?? 1,
					precoUnit: Number(created.precoUnit ?? product.precoVenda ?? 0),
					desconto: Number(created.desconto ?? 0),
					observacao: "",
					tipo: created.tipo ?? "NORMAL",
					productName: product.nome,
					skuLabel,
					skuColor: sku.cor ?? null,
					skuColorCode: sku.codCor ? sku.codCor.toString() : null,
					skuSize: sku.tamanho ?? null,
				});
				return true;
			} catch (error) {
				console.error(error);
				showError(t("salesOrders.form.messages.itemsSaveError"));
				return false;
			}
		},
		[
			append,
			itensSelecionados,
			mode,
			parceiroIdNumber,
			showError,
			t,
			update,
			vendaItemCreateMutation,
			vendaItemUpdateMutation,
			vendaResumo?.id,
		]
	);

	const handleRemoveItem = useCallback(
		async (skuId: number) => {
			if (mode === "view") return;
			const index = itensSelecionados.findIndex(item => item.skuId === skuId);
			if (index === -1) return;

			const item = itensSelecionados[index];
			if (item.remoteId && vendaResumo?.id && parceiroIdNumber) {
				try {
					await vendaItemRemoveMutation.mutateAsync({
						id: String(item.remoteId),
						params: { vendaId: String(vendaResumo.id) },
						headers: { "x-parceiro-id": parceiroIdNumber },
					});
				} catch (error) {
					console.error(error);
					showError(t("salesOrders.form.messages.removeItemError"));
					return;
				}
			}

			remove(index);
		},
		[
			itensSelecionados,
			mode,
			parceiroIdNumber,
			remove,
			showError,
			t,
			vendaItemRemoveMutation,
			vendaResumo?.id,
		]
	);

	const handleUpdateQuantity = useCallback(
		async (skuId: number, quantity: number) => {
			if (mode === "view") return;
			const index = itensSelecionados.findIndex(item => item.skuId === skuId);
			if (index === -1) return;

			const item = itensSelecionados[index];
			const safeValue = Number.isNaN(quantity) ? 1 : Math.max(1, quantity);

			if (item.remoteId && vendaResumo?.id && parceiroIdNumber) {
				try {
					await vendaItemUpdateMutation.mutateAsync({
						id: String(item.remoteId),
						params: { vendaId: String(vendaResumo.id) },
						headers: { "x-parceiro-id": parceiroIdNumber },
						data: {
							qtdReservada: safeValue,
							precoUnit: Number(item.precoUnit),
							desconto: Number(item.desconto ?? 0),
						},
					});
				} catch (error) {
					console.error(error);
					showError(t("salesOrders.form.messages.itemsSaveError"));
					return;
				}
			}

			update(index, { ...item, qtdReservada: safeValue });
		},
		[
			itensSelecionados,
			mode,
			parceiroIdNumber,
			showError,
			t,
			update,
			vendaItemUpdateMutation,
			vendaResumo?.id,
		]
	);

	const handleSearchSkuByCode = useCallback(
		async (discount: number = 0) => {
			if (!selectedLocalId || !skuSearchCode.trim()) {
				showError(t("salesOrders.form.messages.searchSkuError"));
				return null;
			}

			try {
				const skuId = parseInt(skuSearchCode.slice(-3), 10);
				if (Number.isNaN(skuId)) {
					showError(t("salesOrders.form.messages.invalidSkuFormat"));
					return null;
				}

				const estoqueSku = await estoqueSkuControllerFindOne(
					selectedLocalId,
					skuId
				);

				if (!estoqueSku || estoqueSku.qtd <= 0 || !estoqueSku.sku) {
					showError(t("salesOrders.form.messages.skuWithoutStock"));
					return null;
				}

				const skuData = estoqueSku.sku as EstoqueSkuData;
				const skuForSale: ProdutoSKUEstoqueResponseDto = {
					id: estoqueSku.skuId,
					publicId: skuData.publicId || estoqueSku.skuId.toString(),
					cor: skuData.cor || "",
					tamanho: skuData.tamanho || "",
					codCor: skuData.codCor ?? 0,
					qtdMinima: skuData.qtdMinima ?? 0,
					estoque: estoqueSku.qtd,
				};

				const productFromList =
					produtosDisponiveis.find(produto =>
						produto.ProdutoSKU?.some(item => item.id === skuForSale.id)
					) || null;

				const fallbackProduct: ProdutosPorLocalResponseDto = {
					id: skuData.produto?.id ?? skuForSale.id,
					publicId: skuData.produto?.publicId || skuForSale.publicId,
					nome:
						skuData.produto?.nome ||
						t("salesOrders.form.labels.unknownProduct"),
					descricao: undefined,
					imgURL: undefined,
					precoVenda: Number(skuData.produto?.precoVenda ?? 0),
					precoCompra: Number(skuData.produto?.precoCompra ?? 0),
					ativo: skuData.produto?.ativo ?? true,
					consignado: skuData.produto?.consignado ?? false,
					ProdutoSKU: [skuForSale],
				};

				const resolvedProduct = productFromList ?? fallbackProduct;
				const resolvedSku =
					productFromList?.ProdutoSKU?.find(item => item.id === skuForSale.id) ??
					skuForSale;

				if (resolvedProduct.id) {
					setSelectedProductId(resolvedProduct.id);
				}

				const added = await handleAddSku(resolvedSku, resolvedProduct, discount);
				if (!added) {
					return null;
				}
				setSkuSearchCode("");

				setTimeout(() => {
					skuListingRef.current?.scrollToItem(resolvedSku.id);
				}, 150);
				setTimeout(() => {
					selectedSkusRef.current?.scrollToItem(resolvedSku.id);
				}, 300);

				return { sku: resolvedSku, product: resolvedProduct };
			} catch (error) {
				console.error(error);
				showError(t("salesOrders.form.messages.searchSkuServerError"));
				return null;
			}
		},
		[
			handleAddSku,
			produtosDisponiveis,
			selectedLocalId,
			setSkuSearchCode,
			setSelectedProductId,
			showError,
			skuSearchCode,
			t,
			skuListingRef,
			selectedSkusRef,
		]
	);

	const findSkuByCode = useCallback(async () => {
		if (!selectedLocalId || !skuSearchCode.trim()) {
			showError(t("salesOrders.form.messages.searchSkuError"));
			return null;
		}

		try {
			const skuId = parseInt(skuSearchCode.slice(-3), 10);
			if (Number.isNaN(skuId)) {
				showError(t("salesOrders.form.messages.invalidSkuFormat"));
				return null;
			}

			const estoqueSku = await estoqueSkuControllerFindOne(
				selectedLocalId,
				skuId
			);

			if (!estoqueSku || estoqueSku.qtd <= 0 || !estoqueSku.sku) {
				showError(t("salesOrders.form.messages.skuWithoutStock"));
				return null;
			}

			const skuData = estoqueSku.sku as EstoqueSkuData;
			const skuForSale: ProdutoSKUEstoqueResponseDto = {
				id: estoqueSku.skuId,
				publicId: skuData.publicId || estoqueSku.skuId.toString(),
				cor: skuData.cor || "",
				tamanho: skuData.tamanho || "",
				codCor: skuData.codCor ?? 0,
				qtdMinima: skuData.qtdMinima ?? 0,
				estoque: estoqueSku.qtd,
			};

			const productFromList =
				produtosDisponiveis.find(produto =>
					produto.ProdutoSKU?.some(item => item.id === skuForSale.id)
				) || null;

			const fallbackProduct: ProdutosPorLocalResponseDto = {
				id: skuData.produto?.id ?? skuForSale.id,
				publicId: skuData.produto?.publicId || skuForSale.publicId,
				nome:
					skuData.produto?.nome || t("salesOrders.form.labels.unknownProduct"),
				descricao: undefined,
				imgURL: undefined,
				precoVenda: Number(skuData.produto?.precoVenda ?? 0),
				precoCompra: Number(skuData.produto?.precoCompra ?? 0),
				ativo: skuData.produto?.ativo ?? true,
				consignado: skuData.produto?.consignado ?? false,
				ProdutoSKU: [skuForSale],
			};

			const resolvedProduct = productFromList ?? fallbackProduct;
			const resolvedSku =
				productFromList?.ProdutoSKU?.find(item => item.id === skuForSale.id) ??
				skuForSale;

			if (resolvedProduct.id) {
				setSelectedProductId(resolvedProduct.id);
			}

			return { sku: resolvedSku, product: resolvedProduct };
		} catch (error) {
			console.error(error);
			showError(t("salesOrders.form.messages.searchSkuServerError"));
			return null;
		}
	}, [produtosDisponiveis, selectedLocalId, setSelectedProductId, showError, skuSearchCode, t]);

	const handleUpdateDiscount = useCallback(
		async (skuId: number, discount: number) => {
			if (mode === "view") return;
			const index = itensSelecionados.findIndex(item => item.skuId === skuId);
			if (index === -1) return;

			const item = itensSelecionados[index];
			const safeDiscount = Math.max(0, discount);

			if (item.remoteId && vendaResumo?.id && parceiroIdNumber) {
				try {
					await vendaItemUpdateMutation.mutateAsync({
						id: String(item.remoteId),
						params: { vendaId: String(vendaResumo.id) },
						headers: { "x-parceiro-id": parceiroIdNumber },
						data: {
							qtdReservada: item.qtdReservada,
							precoUnit: Number(item.precoUnit),
							desconto: Number(safeDiscount),
						},
					});
				} catch (error) {
					console.error(error);
					showError(t("salesOrders.form.messages.itemsSaveError"));
					return;
				}
			}

			update(index, { ...item, desconto: safeDiscount });
		},
		[
			itensSelecionados,
			mode,
			parceiroIdNumber,
			showError,
			t,
			update,
			vendaItemUpdateMutation,
			vendaResumo?.id,
		]
	);

	return {
		handleCreateOrUpdateVenda,
		handleAddSku,
		handleRemoveItem,
		handleUpdateQuantity,
		handleUpdateDiscount,
		handleSearchSkuByCode,
		findSkuByCode,
	};
};
