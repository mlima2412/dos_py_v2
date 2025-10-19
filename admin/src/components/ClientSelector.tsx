import React from "react";
import { useTranslation } from "react-i18next";
import { ItemSelector } from "./ItemSelector";
import { useClientesControllerFindByParceiro } from "@/api-client";

export interface ClientSelectorProps {
	parceiroId: string;
	selectedClientId: number | null;
	onClientSelect: (clientId: number) => void;
	disabled?: boolean;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
	parceiroId,
	selectedClientId,
	onClientSelect,
	disabled = false,
	placeholder,
	searchPlaceholder,
	emptyMessage,
}) => {
	const { t } = useTranslation("common");

	const {
		data: clientes = [],
		isLoading,
		error,
	} = useClientesControllerFindByParceiro(parceiroId, {
		query: {
			enabled: !!parceiroId,
		},
	});

	// Transformar clientes para incluir nome completo
	const clientesComNomeCompleto = React.useMemo(() => {
		return clientes.map(cliente => ({
			...cliente,
			nome: cliente.sobrenome
				? `${cliente.nome} ${cliente.sobrenome}`
				: cliente.nome,
		}));
	}, [clientes]);

	return (
		<ItemSelector
			items={clientesComNomeCompleto}
			selectedItemId={selectedClientId}
			onItemSelect={onClientSelect}
			isLoading={isLoading}
			error={error}
			disabled={disabled}
			placeholder={placeholder || t("clients.search")}
			searchPlaceholder={searchPlaceholder || t("clients.search")}
			emptyMessage={emptyMessage || t("clients.noResults")}
			loadingMessage={t("common.loading")}
			errorMessage={t("common.loadError")}
			label={t("salesOrders.columns.client")}
		/>
	);
};
