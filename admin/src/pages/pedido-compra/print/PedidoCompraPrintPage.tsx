import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	usePedidoCompraControllerFindOne,
	usePedidoCompraItemControllerFindByPedidoCompra,
} from "@/api-client";
import PedidoCompraPDF from "./PedidoCompraLayout";
import type {
	PedidoCompraPrintData,
	PedidoCompraItemPrint,
	ProductGroup,
} from "./types";

export const PedidoCompraPrintPage: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const { publicId } = useParams<{ publicId: string }>();
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartnerContext();
	const [pedidoData, setPedidoData] = useState<PedidoCompraPrintData | null>(
		null
	);
	const [loading, setLoading] = useState(true);

	const parceiroIdNumber = selectedPartnerId ? Number(selectedPartnerId) : null;

	// Buscar dados do pedido de compra
	const {
		data: pedido,
		isLoading: isLoadingPedido,
		error: pedidoError,
	} = usePedidoCompraControllerFindOne(
		publicId || "",
		{
			"x-parceiro-id": parceiroIdNumber ?? 0,
		},
		{
			query: {
				enabled: !!(publicId && parceiroIdNumber),
			},
		}
	);

	// Buscar itens do pedido
	const {
		data: pedidoItens,
		isLoading: isLoadingItens,
		error: itensError,
	} = usePedidoCompraItemControllerFindByPedidoCompra(
		pedido?.id.toString() || "",
		{ "x-parceiro-id": parceiroIdNumber ?? 0 },
		{
			query: {
				enabled: !!(pedido?.id && parceiroIdNumber),
			},
		}
	);

	// Processar dados quando ambos os hooks retornarem
	useEffect(() => {
		if (pedido && pedidoItens && !isLoadingPedido && !isLoadingItens) {
			// Agrupar itens por produto e ordenar alfabeticamente
			const groupedItems = new Map<string, PedidoCompraItemPrint[]>();

			pedidoItens.forEach(item => {
				const productName =
					(item.ProdutoSKU?.produto?.nome as string | undefined) || "Produto";
				const cor = item.ProdutoSKU?.cor || "-";
				const tamanho = item.ProdutoSKU?.tamanho || "-";
				const quantidade = item.qtd;
				const valorUnitario =
					typeof item.precoCompra === "number"
						? item.precoCompra
						: typeof item.precoCompra === "string"
							? parseFloat(item.precoCompra)
							: 0;

				if (!groupedItems.has(productName)) {
					groupedItems.set(productName, []);
				}

				groupedItems.get(productName)!.push({
					produto: productName,
					cor,
					tamanho,
					quantidade,
					valorUnitario,
				});
			});

			// Criar grupos de produtos com subtotais, ordenados alfabeticamente
			const productGroups: ProductGroup[] = Array.from(groupedItems.entries())
				.sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
				.map(([productName, items]) => {
					const subtotalQuantity = items.reduce(
						(sum, item) => sum + item.quantidade,
						0
					);
					const subtotalValue = items.reduce(
						(sum, item) => sum + item.quantidade * item.valorUnitario,
						0
					);

					return {
						productName,
						items,
						subtotalQuantity,
						subtotalValue,
					};
				});

			// Calcular totais gerais
			const totalItems = productGroups.reduce(
				(sum, group) => sum + group.subtotalQuantity,
				0
			);

			const valorTotalItens = productGroups.reduce(
				(sum, group) => sum + group.subtotalValue,
				0
			);

			const frete =
				typeof pedido.valorFrete === "number"
					? pedido.valorFrete
					: typeof pedido.valorFrete === "string"
						? parseFloat(pedido.valorFrete)
						: 0;

			const comissao =
				typeof pedido.valorComissao === "number"
					? pedido.valorComissao
					: typeof pedido.valorComissao === "string"
						? parseFloat(pedido.valorComissao)
						: 0;

			const valorTotal = valorTotalItens + frete + comissao;
			const taxaCambio = pedido.cotacao ?? 1;
			const valorTotalConvertido = valorTotal * taxaCambio;

			// Obter dados da moeda
			const moeda = {
				nome: (pedido.currency as { nome?: string })?.nome || "-",
				isoCode: (pedido.currency as { isoCode?: string })?.isoCode || "USD",
				locale: (pedido.currency as { locale?: string })?.locale || "en-US",
			};

			// Obter dados do fornecedor
			const fornecedor = {
				nome: (pedido.fornecedor as { nome?: string })?.nome || "-",
			};

			// Obter dados do local de entrada
			const localEntrada = {
				nome: (pedido.LocalEntrada as { nome?: string })?.nome || "-",
				descricao:
					(pedido.LocalEntrada as { descricao?: string })?.descricao ||
					undefined,
			};

			const processedData: PedidoCompraPrintData = {
				id: pedido.id,
				publicId: pedido.publicId,
				dataPedido: pedido.dataPedido,
				fornecedor,
				moeda,
				localEntrada,
				taxaCambio,
				frete,
				comissao,
				valorTotal,
				valorTotalConvertido,
				productGroups,
				totalItems,
			};

			setPedidoData(processedData);
			setLoading(false);
		}
	}, [pedido, pedidoItens, isLoadingPedido, isLoadingItens]);

	// Tratar erros
	if (pedidoError || itensError) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">
						{t("common.loadError")}
					</h2>
					<p className="text-gray-600">
						{t("purchaseOrders.form.messages.loadError", {
							defaultValue: "Não foi possível carregar o pedido de compra.",
						})}
					</p>
				</div>
			</div>
		);
	}

	// Loading state
	if (loading || isLoadingPedido || isLoadingItens) {
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
	if (!pedidoData) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-600 mb-2">
						{t("purchaseOrders.noResults")}
					</h2>
					<p className="text-gray-500">
						{t("purchaseOrders.form.messages.loadError", {
							defaultValue: "Pedido não encontrado.",
						})}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-screen">
			<PedidoCompraPDF
				pedidoData={pedidoData}
				language={i18n.language}
				currencyLocale={selectedPartnerLocale || "pt-BR"}
				currencyIsoCode={selectedPartnerIsoCode || "BRL"}
			/>
		</div>
	);
};
