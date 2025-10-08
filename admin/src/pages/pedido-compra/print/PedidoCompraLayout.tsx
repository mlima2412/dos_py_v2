import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";

import {
	Page,
	Text,
	View,
	Document,
	StyleSheet,
	PDFViewer,
} from "@react-pdf/renderer";

import { Image as PDFImage } from "@react-pdf/renderer";
import type { PedidoCompraPrintData } from "./types";

// Estilos do documento
const styles = StyleSheet.create({
	page: {
		flexDirection: "column",
		padding: 20,
		fontFamily: "Helvetica",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	logo: {
		width: 150,
		height: 50,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	infoSection: {
		marginBottom: 15,
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	infoLabel: {
		fontSize: 11,
		fontWeight: "bold",
		width: "30%",
	},
	infoValue: {
		fontSize: 11,
		width: "65%",
	},
	table: {
		marginTop: 10,
		borderWidth: 1,
		borderColor: "#e4e4e4",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "#f3f4f6",
		borderBottomWidth: 1,
		borderBottomColor: "#e4e4e4",
	},
	tableHeaderText: {
		fontSize: 11,
		fontWeight: "bold",
		padding: 8,
		textAlign: "center",
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#e4e4e4",
	},
	tableCell: {
		fontSize: 10,
		padding: 8,
		textAlign: "center",
	},
	column1: {
		flex: 2.5, // Produto
		textAlign: "left",
	},
	column2: {
		flex: 1.2, // Cor
	},
	column3: {
		flex: 1, // Tamanho
	},
	column4: {
		flex: 0.8, // Quantidade
	},
	column5: {
		flex: 1.2, // Valor Unitário
		textAlign: "right",
	},
	subtotalRow: {
		flexDirection: "row",
		backgroundColor: "#f8f9fa",
		borderBottomWidth: 1,
		borderBottomColor: "#e4e4e4",
	},
	subtotalCell: {
		fontSize: 10,
		fontWeight: "bold",
		padding: 8,
	},
	totalRow: {
		flexDirection: "row",
		marginTop: 15,
		justifyContent: "space-between",
		padding: 10,
		backgroundColor: "#f8f9fa",
		borderRadius: 5,
	},
	totalText: {
		fontSize: 12,
		fontWeight: "bold",
	},
	footer: {
		marginTop: 20,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#e4e4e4",
		textAlign: "center",
	},
	footerText: {
		fontSize: 10,
		color: "#666",
	},
});

interface PedidoCompraPDFProps {
	pedidoData: PedidoCompraPrintData;
	language?: string;
	currencyLocale?: string;
	currencyIsoCode?: string;
}

export default function PedidoCompraPDF({
	pedidoData,
	language = "pt",
	currencyLocale = "pt-BR",
	currencyIsoCode = "BRL",
}: PedidoCompraPDFProps) {
	if (!pedidoData) {
		return <div>Erro ao carregar os dados do pedido de compra.</div>;
	}

	const locale = language === "es" ? es : ptBR;

	// Traduções baseadas no idioma
	const translations = {
		pt: {
			title: "Relatório de Pedido de Compra",
			supplier: "Fornecedor",
			date: "Data do Pedido",
			currency: "Moeda",
			exchangeRate: "Taxa de Câmbio",
			freight: "Frete",
			commission: "Comissão",
			entryLocation: "Local de Entrada",
			product: "Produto",
			color: "Cor",
			size: "Tamanho",
			quantity: "Quantidade",
			unitValue: "Valor Unitário",
			subtotal: "Subtotal",
			totalItems: "Total de Itens",
			originalTotal: "Valor Total",
			convertedTotal: "Valor Total Convertido",
			generatedAt: "Gerado em",
		},
		es: {
			title: "Informe de Pedido de Compra",
			supplier: "Proveedor",
			date: "Fecha del Pedido",
			currency: "Moneda",
			exchangeRate: "Tipo de Cambio",
			freight: "Flete",
			commission: "Comisión",
			entryLocation: "Local de Entrada",
			product: "Producto",
			color: "Color",
			size: "Tamaño",
			quantity: "Cantidad",
			unitValue: "Valor Unitario",
			subtotal: "Subtotal",
			totalItems: "Total de Ítems",
			originalTotal: "Valor Total",
			convertedTotal: "Valor Total Convertido",
			generatedAt: "Generado en",
		},
	};

	const t =
		translations[language as keyof typeof translations] || translations.pt;

	return (
		<PDFViewer style={{ width: "100%", height: "100vh" }}>
			<Document>
				<Page size="A4" style={styles.page}>
					{/* Cabeçalho */}
					<View style={styles.header}>
						<PDFImage style={styles.logo} src="/logo-central-color.png" />
						<Text style={styles.title}>
							{t.title} - {pedidoData.id.toString().padStart(4, "0")}
						</Text>
					</View>

					{/* Informações Básicas */}
					<View style={styles.infoSection}>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.supplier}:</Text>
							<Text style={styles.infoValue}>{pedidoData.fornecedor.nome}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.date}:</Text>
							<Text style={styles.infoValue}>
								{format(new Date(pedidoData.dataPedido), "dd/MM/yyyy HH:mm", {
									locale,
								})}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.currency}:</Text>
							<Text style={styles.infoValue}>{pedidoData.moeda.nome}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.exchangeRate}:</Text>
							<Text style={styles.infoValue}>
								{pedidoData.taxaCambio.toFixed(2)}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.freight}:</Text>
							<Text style={styles.infoValue}>
								{pedidoData.frete.toLocaleString(pedidoData.moeda.locale, {
									style: "currency",
									currency: pedidoData.moeda.isoCode,
								})}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.commission}:</Text>
							<Text style={styles.infoValue}>
								{pedidoData.comissao.toLocaleString(pedidoData.moeda.locale, {
									style: "currency",
									currency: pedidoData.moeda.isoCode,
								})}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.entryLocation}:</Text>
							<Text style={styles.infoValue}>
								{pedidoData.localEntrada.nome}
								{pedidoData.localEntrada.descricao &&
									` - ${pedidoData.localEntrada.descricao}`}
							</Text>
						</View>
					</View>

					{/* Tabela de Itens */}
					<View style={styles.table}>
						{/* Cabeçalho da Tabela */}
						<View style={styles.tableHeader}>
							<Text style={[styles.tableHeaderText, styles.column1]}>
								{t.product}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column2]}>
								{t.color}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column3]}>
								{t.size}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column4]}>
								{t.quantity}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column5]}>
								{t.unitValue}
							</Text>
						</View>

						{/* Grupos de Produtos */}
						{pedidoData.productGroups.map((group, groupIndex) => (
							<View key={groupIndex}>
								{/* Itens do grupo */}
								{group.items.map((item, itemIndex) => (
									<View style={styles.tableRow} key={itemIndex}>
										<Text style={[styles.tableCell, styles.column1]}>
											{item.produto}
										</Text>
										<Text style={[styles.tableCell, styles.column2]}>
											{item.cor}
										</Text>
										<Text style={[styles.tableCell, styles.column3]}>
											{item.tamanho}
										</Text>
										<Text style={[styles.tableCell, styles.column4]}>
											{item.quantidade}
										</Text>
										<Text style={[styles.tableCell, styles.column5]}>
											{item.valorUnitario.toLocaleString(
												pedidoData.moeda.locale,
												{
													style: "currency",
													currency: pedidoData.moeda.isoCode,
												}
											)}
										</Text>
									</View>
								))}

								{/* Linha de Subtotal */}
								<View style={styles.subtotalRow}>
									<Text style={[styles.subtotalCell, styles.column1]}>
										{t.subtotal} - {group.productName}
									</Text>
									<Text style={[styles.subtotalCell, styles.column2]}></Text>
									<Text style={[styles.subtotalCell, styles.column3]}></Text>
									<Text style={[styles.subtotalCell, styles.column4]}>
										{group.subtotalQuantity}
									</Text>
									<Text
										style={[
											styles.subtotalCell,
											styles.column5,
											{ textAlign: "right" },
										]}
									>
										{group.subtotalValue.toLocaleString(
											pedidoData.moeda.locale,
											{
												style: "currency",
												currency: pedidoData.moeda.isoCode,
											}
										)}
									</Text>
								</View>
							</View>
						))}
					</View>

					{/* Totais */}
					<View style={styles.totalRow}>
						<Text style={styles.totalText}>
							{t.totalItems}: {pedidoData.totalItems}
						</Text>
						<Text style={styles.totalText}>
							{t.originalTotal}:{" "}
							{pedidoData.valorTotal.toLocaleString(pedidoData.moeda.locale, {
								style: "currency",
								currency: pedidoData.moeda.isoCode,
							})}
						</Text>
					</View>

					<View style={styles.totalRow}>
						<Text style={styles.totalText}>{t.convertedTotal}:</Text>
						<Text style={styles.totalText}>
							{pedidoData.valorTotalConvertido.toLocaleString(currencyLocale, {
								style: "currency",
								currency: currencyIsoCode,
							})}
						</Text>
					</View>

					{/* Rodapé */}
					<View style={styles.footer}>
						<Text style={styles.footerText}>
							{t.generatedAt}{" "}
							{format(new Date(), "dd/MM/yyyy HH:mm", { locale })}
						</Text>
					</View>
				</Page>
			</Document>
		</PDFViewer>
	);
}
