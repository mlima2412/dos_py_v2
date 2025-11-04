import { useFormaPagamentoControllerFindAll } from "@/api-client/hooks/useFormaPagamentoControllerFindAll";
import { useFormaPagamentoControllerFindOne } from "@/api-client/hooks/useFormaPagamentoControllerFindOne";
import { useFormaPagamentoControllerCreate } from "@/api-client/hooks/useFormaPagamentoControllerCreate";
import { useFormaPagamentoControllerUpdate } from "@/api-client/hooks/useFormaPagamentoControllerUpdate";
import { useFormaPagamentoControllerAtivar } from "@/api-client/hooks/useFormaPagamentoControllerAtivar";
import { useFormaPagamentoControllerInativar } from "@/api-client/hooks/useFormaPagamentoControllerInativar";
import {
	CreateFormaPagamentoDto,
	UpdateFormaPagamentoDto,
	type FormaPagamentoResponseDto,
} from "@/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";
import { useTranslation } from "react-i18next";
import { usePartner } from "./usePartner";

export const useFormasPagamento = () => {
	const { selectedPartnerId } = usePartner();

	const headers = {
		"x-parceiro-id": selectedPartnerId ? parseInt(selectedPartnerId) : 0,
	};

	const {
		data: formasPagamento,
		isLoading,
		error,
		refetch,
	} = useFormaPagamentoControllerFindAll(headers, {
		query: {
			enabled: !!selectedPartnerId,
		},
	});

	return {
		formasPagamento: (formasPagamento ?? []) as FormaPagamentoResponseDto[],
		isLoading,
		error,
		refetch,
		selectedPartnerId,
	};
};

export const useFormaPagamento = (id: number) => {
	const { selectedPartnerId } = usePartner();

	const headers = {
		"x-parceiro-id": selectedPartnerId ? parseInt(selectedPartnerId) : 0,
	};

	const {
		data: formaPagamento,
		isLoading,
		error,
	} = useFormaPagamentoControllerFindOne(id, headers, {
		query: {
			enabled: !!id && !!selectedPartnerId,
		},
	});

	return {
		formaPagamento,
		isLoading,
		error,
	};
};

export const useFormaPagamentoMutations = () => {
	const queryClient = useQueryClient();
	const { success: toastSuccess, error: toastError } = useToast();
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartner();

	const headers = {
		"x-parceiro-id": selectedPartnerId ? parseInt(selectedPartnerId) : 0,
	};

	const invalidateQueries = () => {
		queryClient.invalidateQueries({
			queryKey: [{ url: "/forma-pagamento" }],
		});
	};

	const createFormaPagamento = useFormaPagamentoControllerCreate({
		mutation: {
			onSuccess: () => {
				toastSuccess(t("paymentMethods.messages.createSuccess"));
				invalidateQueries();
				// Redirecionar para a listagem após sucesso
				window.location.href = "/formaPagamento";
			},
			onError: () => {
				toastError(t("paymentMethods.messages.createError"));
			},
		},
	});

	const updateFormaPagamento = useFormaPagamentoControllerUpdate({
		mutation: {
			onSuccess: () => {
				toastSuccess(t("paymentMethods.messages.updateSuccess"));
				invalidateQueries();
			},
			onError: () => {
				toastError(t("paymentMethods.messages.updateError"));
			},
		},
	});

	const ativarFormaPagamento = useFormaPagamentoControllerAtivar({
		mutation: {
			onSuccess: () => {
				toastSuccess(t("paymentMethods.messages.activateSuccess"));
				invalidateQueries();
			},
			onError: () => {
				toastError(t("paymentMethods.messages.activateError"));
			},
		},
	});

	const inativarFormaPagamento = useFormaPagamentoControllerInativar({
		mutation: {
			onSuccess: () => {
				toastSuccess(t("paymentMethods.messages.deactivateSuccess"));
				invalidateQueries();
			},
			onError: () => {
				toastError(t("paymentMethods.messages.deactivateError"));
			},
		},
	});

	return {
		createFormaPagamento: (data: CreateFormaPagamentoDto) =>
			createFormaPagamento.mutate({ data, headers }),
		updateFormaPagamento: (id: number, data: UpdateFormaPagamentoDto) =>
			updateFormaPagamento.mutate({ id, headers, data }),
		ativarFormaPagamento: (id: number) =>
			ativarFormaPagamento.mutate({ id, headers }),
		inativarFormaPagamento: (id: number) =>
			inativarFormaPagamento.mutate({ id, headers }),
		isCreating: createFormaPagamento.isPending,
		isUpdating: updateFormaPagamento.isPending,
		isActivating: ativarFormaPagamento.isPending,
		isDeactivating: inativarFormaPagamento.isPending,
	};
};
