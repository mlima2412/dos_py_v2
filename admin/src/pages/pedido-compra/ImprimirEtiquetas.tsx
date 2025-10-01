import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LabelsDocument } from "@/components/labels";
import { useTranslation } from "react-i18next";
import { usePartner } from "@/hooks/usePartner";
import {
	usePedidoCompraControllerFindOne,
	usePedidoCompraItemControllerFindByPedidoCompra,
} from "@/api-client";
import type { PedidoCompraItem, ProdutoSKU, Produto } from "@/api-client/types";

// Interface para os dados de etiqueta (exportada para uso externo)
export interface LabelData {
	nomeProduto: string;
	cor: string;
	tamanho: string;
	codigo: string; // Código Produto + "-" + Código SKU
	valor: string;
}

// Interface para as props do componente
export interface ImprimirEtiquetasProps {
	pedidoPublicId?: string;
	items?: LabelData[];
	onClose?: () => void;
}

export const ImprimirEtiquetas: React.FC<ImprimirEtiquetasProps> = ({
	pedidoPublicId,
	items,
	onClose,
}) => {
	const { t } = useTranslation("common");
	const { publicId } = useParams<{ publicId: string }>();
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartner();

	// Usar publicId da URL ou da prop
	const orderPublicId = publicId || pedidoPublicId;
	const parceiroId = selectedPartnerId ? Number(selectedPartnerId) : null;

	// Buscar dados do pedido de compra
	const { data: pedidoData, isLoading: isLoadingPedido } =
		usePedidoCompraControllerFindOne(
			orderPublicId ?? "",
			{ "x-parceiro-id": parceiroId ?? 0 },
			{
				query: {
					enabled: !!(orderPublicId && parceiroId),
				},
			}
		);

	// Buscar itens do pedido de compra
	const { data: pedidoItensData, isLoading: isLoadingItens } =
		usePedidoCompraItemControllerFindByPedidoCompra(
			pedidoData?.id?.toString() ?? "",
			{ "x-parceiro-id": parceiroId ?? 0 },
			{
				query: {
					enabled: !!(pedidoData?.id && parceiroId),
				},
			}
		);

	// Converter dados dos itens para formato de etiqueta
	const labelItems = useMemo<LabelData[]>(() => {
		if (items) return items; // Usar items fornecidos se existirem

		if (!pedidoItensData) return [];

		return pedidoItensData.map((item: PedidoCompraItem) => {
			const produtoSku = item.ProdutoSKU as ProdutoSKU;
			const produto = produtoSku?.produto as Produto;

			return {
				nomeProduto: produto?.nome || "-",
				cor: produtoSku?.cor || "-",
				tamanho: produtoSku?.tamanho || "-",
				codigo: `${produto?.id || ""}-${produtoSku?.id || ""}`,
				valor: produto?.precoVenda?.toString() || "0.00",
			};
		});
	}, [items, pedidoItensData]);

	const isLoading = isLoadingPedido || isLoadingItens;

	const handleBack = () => {
		if (onClose) {
			onClose();
		} else {
			navigate("/pedidoCompra");
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-muted-foreground">{t("common.loading")}</p>
			</div>
		);
	}

	if (!orderPublicId) {
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
							{t("purchaseOrders.labels.title", {
								defaultValue: "Etiquetas de Código de Barras",
							})}
						</CardTitle>
						<div className="flex gap-2">
							<Button variant="outline" onClick={handleBack}>
								{t("common.back", { defaultValue: "Voltar" })}
							</Button>
							<PDFDownloadLink
								document={<LabelsDocument items={labelItems} />}
								fileName={`etiquetas_pedido_${orderPublicId}.pdf`}
							>
								{({ loading }) => (
									<Button disabled={loading}>
										{loading
											? t("common.loading", { defaultValue: "Gerando..." })
											: t("common.download", { defaultValue: "Baixar PDF" })}
									</Button>
								)}
							</PDFDownloadLink>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-sm font-medium">
						{t("purchaseOrders.labels.orderNumber", {
							defaultValue: "Pedido:",
						})}{" "}
						{orderPublicId}
					</p>
				</CardContent>
			</Card>

			{/* Visualizador de PDF */}
			<Card>
				<CardHeader>
					<CardTitle>
						{t("purchaseOrders.labels.preview", {
							defaultValue: "Pré-visualização",
						})}
					</CardTitle>
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
