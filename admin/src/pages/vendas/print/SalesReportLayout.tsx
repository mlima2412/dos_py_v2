import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";

import {
	Page,
	Text,
	View,
	Document,
	StyleSheet,
	PDFViewer,
	Image as PDFImage,
} from "@react-pdf/renderer";

import type { SalesReportData } from "./types";

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
		marginBottom: 10,
	},
	logo: {
		width: 150,
		height: 50,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 5,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 12,
		marginBottom: 10,
		textAlign: "center",
		color: "#666",
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
		fontSize: 10,
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
		fontSize: 9,
		padding: 8,
	},
	yearHeader: {
		backgroundColor: "#dbeafe",
		padding: 8,
		marginTop: 10,
		marginBottom: 5,
		borderRadius: 4,
	},
	yearHeaderText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#1e40af",
		textAlign: "center",
	},
	yearSubtotalRow: {
		flexDirection: "row",
		backgroundColor: "#e0e7ff",
		borderBottomWidth: 3,
		borderBottomColor: "#4f46e5",
		paddingVertical: 10,
		paddingHorizontal: 10,
		marginTop: 5,
	},
	yearSubtotalText: {
		fontSize: 11,
		fontWeight: "bold",
		color: "#1e40af",
	},
	totalRow: {
		flexDirection: "row",
		marginTop: 15,
		justifyContent: "space-between",
		padding: 10,
		backgroundColor: "#dbeafe",
		borderRadius: 5,
	},
	totalText: {
		fontSize: 12,
		fontWeight: "bold",
		color: "#1e40af",
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
	colMonth: {
		flex: 2,
		textAlign: "left",
	},
	colQuantity: {
		flex: 0.8,
		textAlign: "center",
	},
	colDiscount: {
		flex: 1.2,
		textAlign: "right",
	},
	colBrindes: {
		flex: 1.2,
		textAlign: "right",
	},
	colValue: {
		flex: 1.5,
		textAlign: "right",
	},
});

interface SalesReportPDFProps {
	reportData: SalesReportData;
	language?: string;
}

export default function SalesReportPDF({
	reportData,
	language = "pt",
}: SalesReportPDFProps) {
	if (!reportData) {
		return <div>Erro ao carregar os dados do relatório.</div>;
	}

	const locale = language === "es" ? es : ptBR;

	// Traduções baseadas no idioma
	const translations = {
		pt: {
			title: "Relatório de Vendas",
			period: "Período",
			allYears: "Todos os Anos",
			month: "Mês",
			quantity: "Qtd",
			discount: "Desconto",
			brindes: "Brindes",
			value: "Valor Total",
			subtotal: "Subtotal",
			totalSales: "Total de Vendas",
			totalValue: "Valor Total",
			generatedAt: "Gerado em",
		},
		es: {
			title: "Informe de Ventas",
			period: "Período",
			allYears: "Todos los Años",
			month: "Mes",
			quantity: "Cant",
			discount: "Descuento",
			brindes: "Regalos",
			value: "Valor Total",
			subtotal: "Subtotal",
			totalSales: "Total de Ventas",
			totalValue: "Valor Total",
			generatedAt: "Generado en",
		},
	};

	const t =
		translations[language as keyof typeof translations] || translations.pt;

	// Formatar período para exibição
	const getPeriodText = () => {
		if (reportData.year && reportData.year !== "all") {
			return reportData.year;
		}
		return t.allYears;
	};

	const formatCurrency = (value: number) => {
		return value.toLocaleString(reportData.partnerCurrency.locale, {
			style: "currency",
			currency: reportData.partnerCurrency.isoCode,
		});
	};

	return (
		<PDFViewer style={{ width: "100%", height: "100vh" }}>
			<Document>
				<Page size="A4" style={styles.page}>
					{/* Cabeçalho */}
					<View style={styles.header}>
						<PDFImage style={styles.logo} src="/logo-central-color.png" />
						<View>
							<Text style={styles.title}>{t.title}</Text>
							<Text style={styles.subtitle}>
								{t.period}: {getPeriodText()}
							</Text>
						</View>
					</View>

					{/* Relatório por Ano */}
					{reportData.yearGroups.map((yearGroup, yearIndex) => (
						<View key={yearIndex}>
							{/* Cabeçalho do Ano (apenas se houver múltiplos anos) */}
							{reportData.yearGroups.length > 1 && (
								<View style={styles.yearHeader}>
									<Text style={styles.yearHeaderText}>{yearGroup.year}</Text>
								</View>
							)}

							{/* Tabela de Vendas do Ano */}
							<View style={styles.table}>
								{/* Cabeçalho da Tabela */}
								{yearIndex === 0 && (
									<View style={styles.tableHeader}>
										<Text style={[styles.tableHeaderText, styles.colMonth]}>
											{t.month}
										</Text>
										<Text
											style={[styles.tableHeaderText, styles.colQuantity]}
										>
											{t.quantity}
										</Text>
										<Text style={[styles.tableHeaderText, styles.colDiscount]}>
											{t.discount}
										</Text>
										<Text style={[styles.tableHeaderText, styles.colBrindes]}>
											{t.brindes}
										</Text>
										<Text style={[styles.tableHeaderText, styles.colValue]}>
											{t.value}
										</Text>
									</View>
								)}

								{/* Linhas de Meses */}
								{yearGroup.months.map((monthData, monthIndex) => (
									<View style={styles.tableRow} key={monthIndex}>
										<Text style={[styles.tableCell, styles.colMonth]}>
											{monthData.monthName} {monthData.year}
										</Text>
										<Text style={[styles.tableCell, styles.colQuantity]}>
											{monthData.quantidade}
										</Text>
										<Text style={[styles.tableCell, styles.colDiscount]}>
											{formatCurrency(monthData.descontoTotal)}
										</Text>
										<Text style={[styles.tableCell, styles.colBrindes]}>
											{formatCurrency(monthData.valorBrindes)}
										</Text>
										<Text style={[styles.tableCell, styles.colValue]}>
											{formatCurrency(monthData.valorTotal)}
										</Text>
									</View>
								))}
							</View>

							{/* Linha de Subtotal do Ano (apenas se houver múltiplos anos) */}
							{reportData.yearGroups.length > 1 && (
								<View style={styles.yearSubtotalRow}>
									<Text style={[styles.yearSubtotalText, { flex: 1 }]}>
										{t.subtotal} - {yearGroup.year}
									</Text>
									<Text
										style={[
											styles.yearSubtotalText,
											{ width: 120, textAlign: "right" },
										]}
									>
										{formatCurrency(yearGroup.yearTotal)}
									</Text>
								</View>
							)}
						</View>
					))}

					{/* Totais Gerais */}
					<View style={styles.totalRow}>
						<View>
							<Text style={styles.totalText}>
								{t.totalSales}: {reportData.grandQuantity}
							</Text>
							<Text style={[styles.totalText, { fontSize: 10, marginTop: 4 }]}>
								{t.discount}: {formatCurrency(reportData.grandDiscount)}
							</Text>
							<Text style={[styles.totalText, { fontSize: 10, marginTop: 4 }]}>
								{t.brindes}: {formatCurrency(reportData.grandBrindes)} ({reportData.grandBrindesQty})
							</Text>
						</View>
						<Text style={styles.totalText}>
							{t.totalValue}: {formatCurrency(reportData.grandTotal)}
						</Text>
					</View>

					{/* Rodapé */}
					<View style={styles.footer}>
						<Text style={styles.footerText}>
							{t.generatedAt} {format(new Date(), "dd/MM/yyyy HH:mm", { locale })}
						</Text>
					</View>
				</Page>
			</Document>
		</PDFViewer>
	);
}
