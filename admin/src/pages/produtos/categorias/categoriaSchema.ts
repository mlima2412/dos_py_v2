import { z } from "zod";

export const categoriaProdutoSchema = z.object({
	descricao: z.string().min(1, "Nome é obrigatório"),
});

export type CategoriaProdutoFormData = z.infer<typeof categoriaProdutoSchema>;
