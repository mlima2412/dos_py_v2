export const PRODUTO_FORM_DEFAULTS = {
	nome: "",
	descricao: "",
	categoriaId: "",
	fornecedorId: "",
	currencyId: "",
	precoCompra: 0,
	precoVenda: 0,
	ativo: true,
	consignado: false,
	imgURL: "",
} as const;

export const PRODUTO_FORM_GRID_CLASSES = {
	row: "grid grid-cols-1 md:grid-cols-3 gap-4",
	row2: "grid grid-cols-1 md:grid-cols-2 gap-4",
	field: "space-y-2",
} as const;

export const PRODUTO_FORM_TIMEOUTS = {
	selectUpdate: 100,
} as const;
