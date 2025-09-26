import type {
	ProdutoSKUEstoqueResponseDto,
	ProdutosPorLocalResponseDto,
} from "@/api-client/types";
import type { OrderStatusKey } from "../constants/status";

export interface PurchaseOrderListItem {
	id: number;
	publicId: string;
	supplierId: string;
	supplierName: string;
	dataPedido: string;
	valorTotal: number;
	currencyId?: number;
	cotacao?: number;
	status: OrderStatusKey;
}

export type SelectedSkuItem = {
	itemId?: number;
	sku: ProdutoSKUEstoqueResponseDto;
	product: {
		id: number;
		nome: string;
		precoCompra: number;
		currency?: ProdutosPorLocalResponseDto["currency"];
	};
	quantity: number;
	unitPrice: number;
};

export type { OrderStatusKey } from "../constants/status";
