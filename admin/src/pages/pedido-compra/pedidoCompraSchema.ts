import { z } from "zod";

export const pedidoCompraBasicSchema = z.object({
	fornecedorId: z.string().min(1, "Fornecedor é obrigatório"),
	localEntradaId: z.string().min(1, "Local de entrada é obrigatório"),
	currencyId: z.string().min(1, "Moeda é obrigatória"),
	valorFrete: z.string().optional(),
	observacao: z.string().optional(),
	valorComissao: z.string().optional(),
	cotacao: z.string().optional(),
	consignado: z.boolean().default(false),
	status: z.int().default(1),
});

export type PedidoCompraBasicFormData = z.infer<typeof pedidoCompraBasicSchema>;
