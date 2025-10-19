import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { VendaFormMode, VendaFormValues, VendaSummary } from "../types";

const vendaItemSchema = z.object({
	remoteId: z.number().optional(),
	skuId: z.number().int().positive(),
	productId: z.number().int().positive().optional(),
	qtdReservada: z.number().int().positive(),
	precoUnit: z.number().min(0),
	desconto: z.number().min(0).nullable().optional(),
	observacao: z.string().max(255).nullable().optional().or(z.literal("")),
	tipo: z.enum(["NORMAL", "BRINDE"] as const).default("NORMAL"),
	productName: z.string().optional(),
	skuLabel: z.string().optional(),
	skuColor: z.string().nullable().optional(),
	skuColorCode: z.string().nullable().optional(),
	skuSize: z.string().nullable().optional(),
});

const pagamentoFormSchema = z.object({
	formaPagamentoId: z.number().positive("Forma de pagamento obrigatória"),
	valor: z.number().min(0, "Valor deve ser maior ou igual a zero"),
	entrada: z.boolean().default(false),
	valorDelivery: z.number().min(0).optional(),
	// Campos condicionais
	vencimento: z.date().optional(),
	numeroParcelas: z.number().positive().optional(),
	primeiraParcelaData: z.date().optional(),
});

const vendaFormSchema = z.object({
	clienteId: z
		.number({
			required_error: "Cliente obrigatório",
			invalid_type_error: "Cliente obrigatório",
		})
		.int()
		.positive(),
	localSaidaId: z
		.number({
			required_error: "Local de saída obrigatório",
			invalid_type_error: "Local de saída obrigatório",
		})
		.int()
		.positive(),
	tipo: z.enum(["DIRETA", "CONDICIONAL", "BRINDE"] as const),
	dataVenda: z.date(),
	dataEntrega: z.date().nullable().optional(),
	observacao: z.string().max(500).nullable().optional().or(z.literal("")),
	itens: z.array(vendaItemSchema).default([]),
	valorFrete: z.number().min(0).nullable().optional(),
	descontoTotal: z.number().min(0).nullable().optional(),
	tipoVenda: z
		.enum([
			"A_VISTA_IMEDIATA",
			"A_PRAZO_SEM_PARCELAS",
			"PARCELADO",
			"PARCELADO_FLEXIVEL",
		] as const)
		.optional(),
	pagamentos: z.array(pagamentoFormSchema).default([]),
});

const defaultValues: VendaFormValues = {
	clienteId: null,
	localSaidaId: null,
	tipo: "DIRETA",
	dataVenda: new Date(),
	dataEntrega: null,
	observacao: "",
	itens: [],
	valorFrete: null,
	descontoTotal: null,
	tipoVenda: undefined,
	pagamentos: [],
};

interface UseVendaFormProps {
	mode: VendaFormMode;
	publicId?: string;
	setVendaResumo: (
		resumo: VendaSummary | ((prev: VendaSummary | undefined) => VendaSummary)
	) => void;
	setCanAccessItems: (value: boolean) => void;
	setCanAccessReview: (value: boolean) => void;
}

export const useVendaForm = ({
	mode,
	publicId,
	setVendaResumo,
	setCanAccessItems,
	setCanAccessReview,
}: UseVendaFormProps) => {
	const formMethods = useForm<VendaFormValues>({
		defaultValues,
		resolver: zodResolver(vendaFormSchema),
		mode: "onBlur",
	});

	const {
		control,
		getValues,
		reset,
		setValue,
		trigger,
		watch,
		formState: { isSubmitting },
	} = formMethods;

	const { append, remove, update, replace } = useFieldArray({
		name: "itens",
		control,
	});

	return {
		formMethods,
		control,
		getValues,
		reset,
		setValue,
		trigger,
		watch,
		isSubmitting,
		append,
		remove,
		update,
		replace,
	};
};
