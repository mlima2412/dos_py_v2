import type {
	VendaItemEntity,
	VendaStatusEnum,
	VendaTipoEnum,
	PagamentoTipoEnum,
} from "@/api-client/types";
import type {
	ProdutoSKUEstoqueResponseDto,
	ProdutosPorLocalResponseDto,
} from "@/api-client/types";

export type VendaFormMode = "create" | "edit" | "view";

export type VendaFormStep = "basic" | "items" | "billing" | "review";

export interface VendaItemFormData {
	remoteId?: number;
	skuId: number;
	productId?: number;
	qtdReservada: number;
	precoUnit: number;
	desconto?: number;
	observacao?: string;
	tipo?: VendaItemEntity["tipo"];
	productName?: string;
	skuLabel?: string;
	skuColor?: string | null;
	skuColorCode?: string | null;
	skuSize?: string | null;
}

export interface PagamentoFormData {
	tipo: PagamentoTipoEnum; // Cada pagamento tem seu próprio tipo
	formaPagamentoId: number;
	valor: number;
	entrada: boolean;
	valorDelivery?: number;
	// Campos condicionais baseados no tipo do pagamento
	vencimento?: Date; // A_PRAZO_SEM_PARCELAS
	numeroParcelas?: number; // PARCELADO
	primeiraParcelaData?: Date; // PARCELADO
}

export interface VendaFormValues {
	clienteId?: number | null;
	localSaidaId?: number | null;
	tipo: VendaTipoEnum;
	dataVenda: Date;
	dataEntrega?: Date | null;
	observacao?: string;
	itens: VendaItemFormData[];
	valorFrete?: number | null;
	descontoTotal?: number | null;
	comissao?: number | null;
	// Dados de faturamento
	desejaFatura: boolean;
	faturaEmNomeCliente: boolean;
	nomeFatura?: string | null;
	ruccnpjFatura?: string | null;
	numeroFatura?: string | null;
	pagamentos: PagamentoFormData[];
}

export interface VendaSummary {
	id?: number;
	publicId?: string;
	status?: VendaStatusEnum;
	clienteId?: number;
	clienteNome?: string;
	clienteSobrenome?: string;
	localSaidaNome?: string;
}

export interface VendaFormHandlers {
	onAddSku: (
		sku: ProdutoSKUEstoqueResponseDto,
		product: ProdutosPorLocalResponseDto,
		discount?: number
	) => Promise<boolean>;
	onRemoveItem: (skuId: number) => Promise<void>;
	onUpdateQuantity: (skuId: number, qty: number) => Promise<void>;
	onUpdateDiscount: (skuId: number, discount: number) => Promise<void>;
	onSearchSkuByCode: () => Promise<void>;
}

export interface VendaTotals {
	itensSubtotal: number;
	descontoItens: number;
	descontoGeral: number;
	frete: number;
	comissao: number;
	total: number;
}

export interface LocalOption {
	id: number;
	publicId: string;
	nome: string;
}
