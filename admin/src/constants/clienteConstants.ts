export const CLIENTE_FORM_DEFAULTS = {
	nome: "",
	sobrenome: "",
	ruccnpj: "",
	email: "",
	celular: "",
	redeSocial: "",
	parceiroId: "",
	linguagem: undefined as "Espanol" | "Portugues" | undefined,
	canalOrigemId: "",
	endereco: "",
	cidade: "",
	cep: "",
	observacoes: "",
	ativo: true,
	ruccnpjSecundario: "",
	nomeFatura: "",
} as const;

export const CLIENTE_FORM_GRID_CLASSES = {
	row: "grid grid-cols-1 md:grid-cols-3 gap-4",
	field: "space-y-2",
} as const;

export const CLIENTE_FORM_TIMEOUTS = {
	partnerSelection: 100,
} as const;
