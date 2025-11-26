import type {
	VendaItemEntity,
	VendaStatusEnumKey,
	VendaTipoEnumKey,
	PagamentoTipoEnumKey,
} from "@/api-client/types";
import type {
	ProdutoSKUEstoqueResponseDto,
	ProdutosPorLocalResponseDto,
} from "@/api-client/types";

export type VendaFormMode = "create" | "edit" | "view";

export type VendaFormStep = "basic" | "items" | "billing" | "review";

export type DescontoTipo = "VALOR" | "PERCENTUAL";

export interface VendaItemFormData {
	remoteId?: number;
	skuId: number;
	productId?: number;
	qtdReservada: number;
	qtdDevolvida?: number; // Quantidade devolvida (vendas condicionais)
	qtdAceita?: number; // Quantidade aceita = qtdReservada - qtdDevolvida
	precoUnit: number;
	desconto?: number; // Desconto calculado final (R$)
	descontoTipo?: DescontoTipo; // Tipo de desconto aplicado
	descontoValor?: number; // Valor original informado (R$ ou %)
	observacao?: string;
	tipo?: VendaItemEntity["tipo"];
	productName?: string;
	skuLabel?: string;
	skuColor?: string | null;
	skuColorCode?: string | null;
	skuSize?: string | null;
}

export interface PagamentoFormData {
	tipo: PagamentoTipoEnumKey; // Cada pagamento tem seu próprio tipo
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
	tipo: VendaTipoEnumKey;
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
	status?: VendaStatusEnumKey;
	clienteId?: number;
	clienteNome?: string;
	localSaidaNome?: string;
}

export interface VendaFormHandlers {
	onAddSku: (
		sku: ProdutoSKUEstoqueResponseDto,
		product: ProdutosPorLocalResponseDto,
		discountValue?: number,
		discountType?: DescontoTipo
	) => Promise<boolean>;
	onRemoveItem: (skuId: number) => Promise<void>;
	onUpdateQuantity: (skuId: number, qty: number) => Promise<void>;
	onUpdateDiscount: (skuId: number, discountValue: number, discountType: DescontoTipo) => Promise<void>;
	onSearchSkuByCode: (
		discountValue?: number,
		discountType?: DescontoTipo
	) => Promise<null | {
		sku: ProdutoSKUEstoqueResponseDto;
		product: ProdutosPorLocalResponseDto;
	}>;
	onProcessarDevolucao?: (skuId: number) => Promise<void>; // Handler para processar devolução (vendas condicionais)
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
