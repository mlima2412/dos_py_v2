import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useTransferenciaEstoqueControllerFindOne,
	useTransferenciaEstoqueSkuControllerFindByTransferencia,
} from "@/api-client";
import TransferenciaPDF, { TransferenciaPrint } from "./TransferenciaLayout";

export const TransferenciaPrintPage: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const { publicId } = useParams<{ publicId: string }>();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartnerContext();
	const [transferenciaData, setTransferenciaData] =
		useState<TransferenciaPrint | null>(null);
	const [loading, setLoading] = useState(true);

	// Buscar dados da transferência
	const {
		data: transferencia,
		isLoading: isLoadingTransferencia,
		error: transferenciaError,
	} = useTransferenciaEstoqueControllerFindOne(
		publicId || "",
		{
			"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
		},
		{
			query: {
				enabled: !!publicId,
			},
		}
	);

	// Buscar SKUs da transferência
	const {
		data: transferenciaSkus,
		isLoading: isLoadingSkus,
		error: skusError,
	} = useTransferenciaEstoqueSkuControllerFindByTransferencia(publicId || "", {
		query: {
			enabled: !!publicId,
		},
	});

	// Processar dados quando ambos os hooks retornarem
	useEffect(() => {
		if (
			transferencia &&
			transferenciaSkus &&
			!isLoadingTransferencia &&
			!isLoadingSkus
		) {
			const processedData: TransferenciaPrint = {
				id: transferencia.id,
				publicId: transferencia.publicId,
				dataTransferencia: transferencia.dataTransferencia,
				dataRecebimento: transferencia.dataRecebimento || undefined,
				valorTotal: transferencia.valorTotal || 0,
				localOrigem: {
					nome: transferencia.localOrigem.nome,
					descricao: transferencia.localOrigem.descricao || undefined,
				},
				localDestino: {
					nome: transferencia.localDestino.nome,
					descricao: transferencia.localDestino.descricao || undefined,
				},
				enviadoPorUsuario: {
					nome: transferencia.enviadoPorUsuario.nome,
				},
				recebidoPorUsuario: transferencia.recebidoPorUsuario
					? {
							nome: transferencia.recebidoPorUsuario.nome,
						}
					: undefined,
				itens: transferenciaSkus.map(item => ({
					produto: item.produto || "-",
					cor: item.cor || "-",
					tamanho: item.tamanho || "-",
					quantidade: item.quantidade,
					valorProduto: item.precoVenda || 0,
				})),
			};

			setTransferenciaData(processedData);
			setLoading(false);
		}
	}, [transferencia, transferenciaSkus, isLoadingTransferencia, isLoadingSkus]);

	// Tratar erros
	if (transferenciaError || skusError) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">
						{t("common.loadError")}
					</h2>
					<p className="text-gray-600">
						{t("inventory.transfer.messages.loadError")}
					</p>
				</div>
			</div>
		);
	}

	// Loading state
	if (loading || isLoadingTransferencia || isLoadingSkus) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">{t("common.loading")}</p>
				</div>
			</div>
		);
	}

	// Se não há dados
	if (!transferenciaData) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-600 mb-2">
						{t("inventory.transfer.noResults")}
					</h2>
					<p className="text-gray-500">
						{t("inventory.transfer.messages.notFound")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-screen">
			<TransferenciaPDF
				transferenciaData={transferenciaData}
				language={i18n.language}
				currencyLocale={selectedPartnerLocale || "pt-BR"}
				currencyIsoCode={selectedPartnerIsoCode || "BRL"}
			/>
		</div>
	);
};
