import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LabelsDocument } from "@/components/labels";
import { useTranslation } from "react-i18next";
import { usePartner } from "@/hooks/usePartner";
import { useLocalEstoqueControllerImprimeEtiquetasLocalEstoque } from "@/api-client";
import type { EtiquetaPedidoCompraDto } from "@/api-client/types";

// Interface para as props do componente
export interface ImprimirEtiquetasProps {
	estoquePublicId?: string;
	items?: EtiquetaPedidoCompraDto[];
	onClose?: () => void;
}

export const ImprimirEtiquetasEstoque: React.FC<ImprimirEtiquetasProps> = ({
	estoquePublicId,
	items,
	onClose,
}) => {
	const { t } = useTranslation("common");
	const { publicId, nomeLocal } = useParams<{
		publicId: string;
		nomeLocal: string;
	}>();
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartner();

	// Usar publicId da URL ou da prop
	const stockPublicId = publicId || estoquePublicId;
	const parceiroId = selectedPartnerId ? Number(selectedPartnerId) : null;

	// Decodificar o nome do local
	const decodedNomeLocal = nomeLocal ? decodeURIComponent(nomeLocal) : "";

	// Buscar etiquetas do estoque
	const { data: etiquetasData, isLoading } =
		useLocalEstoqueControllerImprimeEtiquetasLocalEstoque(
			stockPublicId ?? "",
			{ "x-parceiro-id": parceiroId ?? 0 },
			{
				query: {
					enabled: !!(stockPublicId && parceiroId),
				},
			}
		);

	// Usar dados das etiquetas
	const labelItems = useMemo<EtiquetaPedidoCompraDto[]>(() => {
		if (items) return items; // Usar items fornecidos se existirem
		return etiquetasData || [];
	}, [items, etiquetasData]);

	const handleBack = () => {
		if (onClose) {
			onClose();
		} else {
			navigate("/estoques");
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-muted-foreground">{t("common.loading")}</p>
			</div>
		);
	}

	if (!stockPublicId) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-muted-foreground">{t("common.noPartnerSelected")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header com botões */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>
							{t("inventory.labels.title")} - {decodedNomeLocal}
						</CardTitle>
						<div className="flex gap-2">
							<Button variant="outline" onClick={handleBack}>
								{t("common.back")}
							</Button>
							<PDFDownloadLink
								document={<LabelsDocument items={labelItems} />}
								fileName={`etiquetas_estoque_${stockPublicId}.pdf`}
							>
								{({ loading }) => (
									<Button disabled={loading}>
										{loading ? t("common.loading") : t("common.download")}
									</Button>
								)}
							</PDFDownloadLink>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-sm font-medium">
						{t("inventory.labels.stockNumber")} {stockPublicId}
					</p>
				</CardContent>
			</Card>

			{/* Visualizador de PDF */}
			<Card>
				<CardHeader>
					<CardTitle>{t("inventory.labels.preview")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="w-full border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
						<PDFViewer
							width="100%"
							height="600"
							showToolbar={true}
							className="border-0"
						>
							<LabelsDocument items={labelItems} />
						</PDFViewer>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
