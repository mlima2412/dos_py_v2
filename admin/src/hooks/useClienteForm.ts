import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/useToast";
import {
	createClienteFormSchema,
	ClienteFormData,
} from "@/pages/clientes/clienteSchema";
import {
	CLIENTE_FORM_DEFAULTS,
	CLIENTE_FORM_TIMEOUTS,
} from "@/constants/clienteConstants";
import {
	transformClienteToForm,
	transformFormToCreateCliente,
	transformFormToUpdateCliente,
} from "@/pages/clientes/clienteTransformers";
import {
	useClientesControllerCreate,
	useClientesControllerUpdate,
} from "@/api-client";
import { Cliente, Parceiro } from "@/api-client";

interface UseClienteFormProps {
	cliente?: Cliente;
	isEditing: boolean;
	parceiros: Parceiro[];
}

export const useClienteForm = ({
	cliente,
	isEditing,
	parceiros,
}: UseClienteFormProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const toast = useToast();

	// Criar schema com traduções
	const formSchema = createClienteFormSchema(t);

	const form = useForm<ClienteFormData>({
		resolver: zodResolver(formSchema),
		defaultValues: CLIENTE_FORM_DEFAULTS,
	});

	const { reset, setValue } = form;

	// Mutations
	const createMutation = useClientesControllerCreate();
	const updateMutation = useClientesControllerUpdate();

	// Populate form when editing
	useEffect(() => {
		if (cliente && isEditing) {
			const formData = transformClienteToForm(cliente);
			reset(formData);
		}
	}, [cliente, isEditing, reset]);

	// Force update partner selection when partners load
	useEffect(() => {
		if (cliente && parceiros.length > 0 && isEditing) {
			const parceiroId = cliente.parceiroId ? String(cliente.parceiroId) : "";
			if (parceiroId) {
				setTimeout(() => {
					setValue("parceiroId", parceiroId, { shouldValidate: true });
				}, CLIENTE_FORM_TIMEOUTS.partnerSelection);
			}
		}
	}, [cliente, parceiros, isEditing, setValue]);

	// Force update language selection when editing
	useEffect(() => {
		if (cliente && isEditing) {
			const linguagem = cliente.linguagem;
			if (linguagem) {
				setTimeout(() => {
					setValue("linguagem", linguagem, { shouldValidate: true });
				}, CLIENTE_FORM_TIMEOUTS.partnerSelection);
			}
		}
	}, [cliente, isEditing, setValue]);

	const onSubmit = useCallback(
		async (data: ClienteFormData) => {
			try {
				if (isEditing && cliente?.publicId) {
					const payload = transformFormToUpdateCliente(data);
					await updateMutation.mutateAsync({
						publicId: cliente.publicId,
						data: payload,
					});
				} else {
					const payload = transformFormToCreateCliente(data);
					await createMutation.mutateAsync({ data: payload });
				}

				toast.success(
					isEditing
						? t("clients.messages.updateSuccess")
						: t("clients.messages.createSuccess")
				);
				navigate("/clientes");
			} catch (error) {
				console.error("Erro ao salvar cliente:", error);
				toast.error(
					isEditing
						? t("clients.messages.updateError")
						: t("clients.messages.createError")
				);
			}
		},
		[isEditing, cliente, updateMutation, createMutation, toast, t, navigate]
	);

	return {
		form,
		onSubmit,
		isSubmitting:
			form.formState.isSubmitting ||
			createMutation.isPending ||
			updateMutation.isPending,
	};
};
