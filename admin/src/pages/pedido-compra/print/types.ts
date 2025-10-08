export type PedidoCompraItemPrint = {
	produto: string;
	cor: string;
	tamanho: string;
	quantidade: number;
	valorUnitario: number;
};

export type ProductGroup = {
	productName: string;
	items: PedidoCompraItemPrint[];
	subtotalQuantity: number;
	subtotalValue: number;
};

export type PedidoCompraPrintData = {
	id: number;
	publicId: string;
	dataPedido: string;
	fornecedor: {
		nome: string;
	};
	moeda: {
		nome: string;
		isoCode: string;
		locale: string;
	};
	localEntrada: {
		nome: string;
		descricao?: string;
	};
	taxaCambio: number;
	frete: number;
	comissao: number;
	valorTotal: number;
	valorTotalConvertido: number;
	productGroups: ProductGroup[];
	totalItems: number;
};
