import React from "react";
import { toast } from "react-toastify";
import {
	usePedidoCompraItemControllerCreate,
	usePedidoCompraItemControllerUpdate,
	usePedidoCompraItemControllerRemove,
} from "@/api-client";
import type {
	PedidoCompra,
	PedidoCompraItem,
	ProdutoSKUEstoqueResponseDto,
	ProdutosPorLocalResponseDto,
} from "@/api-client/types";
import type { TFunction } from "i18next";
import type { SelectedSkuItem } from "../types";
import type { PedidoCompraBasicFormData } from "../pedidoCompraSchema";
import type { PurchaseOrderTotals } from "./usePurchaseOrderTotals";

interface UsePurchaseOrderItemsParams {
	partnerId: number | null;
	pedidoAtual: PedidoCompra | null;
	pedidoIdForItems: number | null | undefined;
	pedidoItensData?: PedidoCompraItem[];
	isLoadingItens: boolean;
	buildSelectedSkuFromItem: (item: PedidoCompraItem) => SelectedSkuItem;
	persistTotals: (items: SelectedSkuItem[]) => void;
	updateTotalsState: (
		items?: SelectedSkuItem[],
		values?: Partial<PedidoCompraBasicFormData>
	) => PurchaseOrderTotals;
	invalidateItensQuery: () => void;
	t: TFunction<"common">;
	isPersistingTotals: boolean;
	selectedSkusRef: React.MutableRefObject<SelectedSkuItem[]>;
}

interface HandleAddSkuOptions {
	selectedProduct: ProdutosPorLocalResponseDto | null;
	selectedProductId: number | null;
}

export const usePurchaseOrderItems = ({
	partnerId,
	pedidoAtual,
	pedidoIdForItems,
	pedidoItensData,
	isLoadingItens,
	buildSelectedSkuFromItem,
	persistTotals,
	updateTotalsState,
	invalidateItensQuery,
	t,
	isPersistingTotals,
 	selectedSkusRef,
}: UsePurchaseOrderItemsParams) => {
	const [selectedSkus, setSelectedSkus] = React.useState<SelectedSkuItem[]>([]);
	const [adjustedPrices, setAdjustedPrices] = React.useState<Record<number, number>>({});

	React.useEffect(() => {
		selectedSkusRef.current = selectedSkus;
	}, [selectedSkus]);

	const createItemMutation = usePedidoCompraItemControllerCreate({
		mutation: {
			onSuccess: item => {
				const selectedItem = buildSelectedSkuFromItem(item);
				setSelectedSkus(prev => {
					const nextItems = [...prev, selectedItem];
					persistTotals(nextItems);
					return nextItems;
				});
				setAdjustedPrices(prev => ({
					...prev,
					[selectedItem.product.id]: selectedItem.unitPrice,
				}));
				invalidateItensQuery();
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.itemCreateError", {
						defaultValue: "Não foi possível adicionar o item ao pedido.",
					})
				);
			},
		},
	});

	const updateItemMutation = usePedidoCompraItemControllerUpdate({
		mutation: {
			onSuccess: item => {
				const updatedItem = buildSelectedSkuFromItem(item);
				setSelectedSkus(prev => {
					const nextItems = prev.map(existing =>
						existing.itemId === item.id ? updatedItem : existing
					);
					persistTotals(nextItems);
					return nextItems;
				});
				setAdjustedPrices(prev => ({
					...prev,
					[updatedItem.product.id]: updatedItem.unitPrice,
				}));
				invalidateItensQuery();
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.itemUpdateError", {
						defaultValue: "Não foi possível atualizar o item do pedido.",
					})
				);
			},
		},
	});

	const removeItemMutation = usePedidoCompraItemControllerRemove({
		mutation: {
			onSuccess: (_, variables) => {
				const removedId = Number(variables.id);
				setSelectedSkus(prev => {
					const nextItems = prev.filter(item => item.itemId !== removedId);
					persistTotals(nextItems);
					return nextItems;
				});
				invalidateItensQuery();
			},
			onError: () => {
				toast.error(
					t("purchaseOrders.form.messages.itemRemoveError", {
						defaultValue: "Não foi possível remover o item do pedido.",
					})
				);
			},
		},
	});

	const isMutatingItems =
		isLoadingItens ||
		createItemMutation.isPending ||
		updateItemMutation.isPending ||
		removeItemMutation.isPending ||
		isPersistingTotals;

	const handleAddSkuToPurchase = (
		sku: ProdutoSKUEstoqueResponseDto,
		{ selectedProduct, selectedProductId }: HandleAddSkuOptions
	) => {
		if (isMutatingItems) return;
		if (!selectedProduct) return;
		if (!pedidoAtual || !pedidoAtual.id) {
			toast.warn(
				t("purchaseOrders.form.messages.saveBeforeAdding", {
					defaultValue: "Salve o pedido antes de adicionar itens.",
				})
			);
			return;
		}
		if (!partnerId) {
			toast.error(t("common.noPartnerSelected"));
			return;
		}

		const existingItem = selectedSkusRef.current.find(
			item => item.sku.id === sku.id
		);

		if (existingItem && existingItem.itemId) {
			const previousItems = selectedSkusRef.current.map(selected => ({
				...selected,
				product: { ...selected.product },
				sku: { ...selected.sku },
			}));
			const newQuantity = existingItem.quantity + 1;
			const nextItems = previousItems.map(item =>
				item.sku.id === sku.id ? { ...item, quantity: newQuantity } : item
			);
			setSelectedSkus(nextItems);
			persistTotals(nextItems);
			updateItemMutation.mutate(
				{
					id: existingItem.itemId.toString(),
					headers: { "x-parceiro-id": partnerId },
					data: {
						qtd: newQuantity,
						precoCompra: existingItem.unitPrice,
					},
				},
				{
					onError: () => {
						setSelectedSkus(previousItems);
						persistTotals(previousItems);
					},
				}
			);
			return;
		}

		const unitPrice =
			(selectedProductId && adjustedPrices[selectedProductId]) ??
			selectedProduct.precoCompra ??
			0;

		createItemMutation.mutate({
			data: {
				pedidoCompraId: pedidoAtual.id,
				skuId: sku.id,
				qtd: 1,
				precoCompra: unitPrice,
			},
			headers: { "x-parceiro-id": partnerId },
		});
	};

	const handleRemoveSku = (skuId: number) => {
		if (isMutatingItems) return;
		const item = selectedSkusRef.current.find(selected => selected.sku.id === skuId);
		if (!item) return;

		if (!item.itemId || !partnerId) {
			const nextItems = selectedSkusRef.current.filter(
				selected => selected.sku.id !== skuId
			);
			setSelectedSkus(nextItems);
			persistTotals(nextItems);
			return;
		}

		removeItemMutation.mutate({
			id: item.itemId.toString(),
			headers: { "x-parceiro-id": partnerId },
		});
	};

	const handleUpdateQuantity = (skuId: number, quantity: number) => {
		if (isMutatingItems) return;
		const item = selectedSkusRef.current.find(selected => selected.sku.id === skuId);
		if (!item) return;

		const previousItems = selectedSkusRef.current.map(selected => ({
			...selected,
			product: { ...selected.product },
			sku: { ...selected.sku },
		}));
		const nextItems = previousItems.map(selected =>
			selected.sku.id === skuId ? { ...selected, quantity } : selected
		);
		setSelectedSkus(nextItems);
		persistTotals(nextItems);

		if (!item.itemId || !partnerId) {
			return;
		}

		updateItemMutation.mutate(
			{
				id: item.itemId.toString(),
				headers: { "x-parceiro-id": partnerId },
				data: {
					qtd: quantity,
					precoCompra: item.unitPrice,
				},
			},
			{
				onError: () => {
					setSelectedSkus(previousItems);
					persistTotals(previousItems);
				},
			}
		);
	};

	const handlePriceChange = (selectedProductId: number | null, newPrice: number) => {
		if (!selectedProductId) return;
		setAdjustedPrices(prev => ({
			...prev,
			[selectedProductId]: newPrice,
		}));
	};

	React.useEffect(() => {
		if (!pedidoItensData) {
			if (!pedidoIdForItems && selectedSkusRef.current.length > 0) {
				setSelectedSkus([]);
				setAdjustedPrices({});
				updateTotalsState([]);
			}
			return;
		}

    const mappedItems = pedidoItensData.map(buildSelectedSkuFromItem);
	const hasChanged =
		mappedItems.length !== selectedSkusRef.current.length ||
		mappedItems.some((item, index) => {
			const current = selectedSkusRef.current[index];
			return (
				!current ||
				current.itemId !== item.itemId ||
				current.quantity !== item.quantity ||
				current.unitPrice !== item.unitPrice
			);
		});

    if (!hasChanged) {
        return;
    }

    setSelectedSkus(mappedItems);
    setAdjustedPrices(prev => {
        const next = { ...prev };
        mappedItems.forEach(item => {
            if (item.product.id) {
                next[item.product.id] = item.unitPrice;
            }
        });
        return next;
    });
    updateTotalsState(mappedItems);
	}, [
		pedidoItensData,
		buildSelectedSkuFromItem,
		pedidoIdForItems,
		updateTotalsState,
	]);

const clearSelectedItems = React.useCallback(() => {
	setSelectedSkus(current => {
		if (current.length === 0) {
			return current;
		}
		return [];
	});
	setAdjustedPrices(prev => {
		if (Object.keys(prev).length === 0) {
			return prev;
		}
		return {};
	});
	updateTotalsState([]);
}, [updateTotalsState]);

	return {
		selectedSkus,
		adjustedPrices,
		handleAddSkuToPurchase,
		handleRemoveSku,
		handleUpdateQuantity,
		handlePriceChange,
		setSelectedSkus,
		setAdjustedPrices,
		isMutatingItems,
		createItemMutation,
		updateItemMutation,
		removeItemMutation,
		clearSelectedItems,
	};
};
