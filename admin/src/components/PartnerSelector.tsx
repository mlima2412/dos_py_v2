import React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthControllerGetUserParceiros200 } from "@/api-client";

type ParceiroItem = AuthControllerGetUserParceiros200[0];

interface PartnerSelectorProps {
	selectedPartnerId?: string | null;
	onPartnerChange?: (partnerId: string | null, partnerName: string) => void;
}

export const PartnerSelector: React.FC<PartnerSelectorProps> = ({
	selectedPartnerId: propSelectedPartnerId,
	onPartnerChange: propOnPartnerChange,
}) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const {
		selectedPartnerId: contextSelectedPartnerId,
		parceiros,
		isLoading,
		error,
		setSelectedPartner,
		hasPartners,
	} = usePartnerContext();

	// Usar props se fornecidas, senão usar contexto
	const selectedPartnerId = propSelectedPartnerId ?? contextSelectedPartnerId;
	const onPartnerChange = propOnPartnerChange ?? setSelectedPartner;

	// Filtrar parceiros válidos (que têm parceiroId e nome)
	const validParceiros =
		parceiros?.filter((p: ParceiroItem) => p.parceiroId && p.Parceiro?.nome) ||
		[];

	const selectedPartner = parceiros?.find(
		(p: ParceiroItem) => p.parceiroId?.toString() === selectedPartnerId
	);

	const handleSelect = (value: string) => {
		const parceiro = validParceiros.find(
			(p: ParceiroItem) => p.parceiroId?.toString() === value
		);
		if (parceiro?.Parceiro?.nome) {
			onPartnerChange(value, parceiro.Parceiro.nome);

			// Invalidar todas as queries relacionadas a despesas para forçar refresh
			queryClient.invalidateQueries({ queryKey: ["despesas"] });
			queryClient.invalidateQueries({ queryKey: ["despesa"] });
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center space-x-2">
				<Spinner size="sm" />
				<span className="text-sm text-muted-foreground">
					{t("common.loading", { defaultValue: "Carregando..." })}
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-sm text-destructive">
				{t("common.errorLoading", { defaultValue: "Erro ao carregar" })}
			</div>
		);
	}

	// Se não há parceiros válidos, mostrar mensagem de erro
	if (
		!hasPartners ||
		!parceiros ||
		parceiros.length === 0 ||
		validParceiros.length === 0
	) {
		return (
			<div className="text-sm text-muted-foreground">
				{t("common.noPartnersAvailable", {
					defaultValue: "Nenhum parceiro disponível",
				})}
			</div>
		);
	}

	// Se há apenas um parceiro válido, mostrar apenas como texto (sem select)
	if (validParceiros.length === 1) {
		const singlePartner = validParceiros[0];
		return (
			<div className="flex items-center">
				<span className="text-sm font-medium">
					{singlePartner?.Parceiro?.nome || "Parceiro"}
				</span>
			</div>
		);
	}

	// Se há múltiplos parceiros (2 ou mais), mostrar o select
	return (
		<div className="flex items-center">
			<Select value={selectedPartnerId || ""} onValueChange={handleSelect}>
				<SelectTrigger className="w-[280px]">
					<SelectValue placeholder={"Selecione um parceiro"}>
						{selectedPartner?.Parceiro?.nome || "Selecione um parceiro"}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{/* Lista de parceiros válidos associados ao usuário */}
					{validParceiros.map((parceiro: ParceiroItem) => (
						<SelectItem
							key={parceiro.parceiroId}
							value={parceiro.parceiroId!.toString()}
						>
							<div className="flex flex-col">
								<span className="font-medium">{parceiro.Parceiro!.nome}</span>
								{parceiro.Parceiro!.publicId && (
									<span className="text-xs text-muted-foreground">
										ID: {parceiro.Parceiro!.publicId}
									</span>
								)}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
