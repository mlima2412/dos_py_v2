import { z } from "zod";

// Schema de validação com i18n
export const createClienteFormSchema = (t: (key: string) => string) =>
	z.object({
		nome: z.string().min(1, t("clients.validations.name")),
		sobrenome: z.string().optional(),
		ruccnpj: z.string().optional(),
		email: z
			.string()
			.email(t("clients.validations.email"))
			.optional()
			.or(z.literal("")),
		celular: z.string().optional(),
		redeSocial: z.string().optional(),
		parceiroId: z.string().min(1, t("clients.validations.partner")),
		linguagem: z
			.enum(["Espanol", "Portugues"], {
				message: t("clients.validations.language"),
			})
			.optional(),
		canalOrigemId: z.string().optional(),
		endereco: z.string().optional(),
		cidade: z.string().optional(),
		cep: z.string().optional(),
		observacoes: z.string().optional(),
		ativo: z.boolean(),
	});

export type ClienteFormData = z.infer<
	ReturnType<typeof createClienteFormSchema>
>;
