import { Cliente } from "@/api-client";
import { ClienteFormData } from "@/schemas/clienteSchema";
import { CreateClienteDto, UpdateClienteDto } from "@/api-client";

export const transformClienteToForm = (cliente: Cliente): ClienteFormData => ({
	nome: cliente.nome || "",
	sobrenome: cliente.sobrenome || "",
	ruccnpj: cliente.ruccnpj || "",
	email: cliente.email || "",
	celular: cliente.celular || "",
	redeSocial: cliente.redeSocial || "",
	parceiroId: cliente.parceiroId ? String(cliente.parceiroId) : "",
	linguagem: cliente.linguagem || undefined,
	canalOrigemId: cliente.canalOrigemId ? String(cliente.canalOrigemId) : "",
	endereco: cliente.endereco || "",
	cidade: cliente.cidade || "",
	cep: cliente.cep || "",
	observacoes: cliente.observacoes || "",
	ativo: cliente.ativo ?? true,
	ruccnpjSecundario: cliente.ruccnpjSecundario || "",
	nomeFatura: (cliente as { nomeFatura?: string }).nomeFatura || "",
});

// Helper function to convert empty strings to undefined for unique fields
const cleanUniqueFields = (data: ClienteFormData) => ({
	...data,
	ruccnpj:
		data.ruccnpj && data.ruccnpj.trim() !== "" ? data.ruccnpj : undefined,
	email: data.email && data.email.trim() !== "" ? data.email : undefined,
	ruccnpjSecundario:
		data.ruccnpjSecundario && data.ruccnpjSecundario.trim() !== ""
			? data.ruccnpjSecundario
			: undefined,
	nomeFatura:
		data.nomeFatura && data.nomeFatura.trim() !== ""
			? data.nomeFatura
			: undefined,
});

export const transformFormToCreateCliente = (
	data: ClienteFormData
): CreateClienteDto => {
	const cleanedData = cleanUniqueFields(data);
	return {
		id: 0, // Será gerado pelo backend
		publicId: "", // Será gerado pelo backend
		...cleanedData,
		parceiroId: parseInt(cleanedData.parceiroId),
		canalOrigemId: cleanedData.canalOrigemId
			? parseInt(cleanedData.canalOrigemId)
			: undefined,
	};
};

export const transformFormToUpdateCliente = (
	data: ClienteFormData
): UpdateClienteDto => {
	const cleanedData = cleanUniqueFields(data);
	return {
		...cleanedData,
		parceiroId: cleanedData.parceiroId
			? parseInt(cleanedData.parceiroId)
			: undefined,
		canalOrigemId: cleanedData.canalOrigemId
			? parseInt(cleanedData.canalOrigemId)
			: undefined,
	};
};
