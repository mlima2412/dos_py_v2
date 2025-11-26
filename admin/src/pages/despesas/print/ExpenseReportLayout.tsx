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

import type { ExpenseReportData } from "./types";

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
	subtitle: {
		fontSize: 12,
		marginBottom: 20,
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
	monthHeader: {
		backgroundColor: "#e0e7ff",
		padding: 10,
		marginTop: 15,
		marginBottom: 5,
	},
	monthHeaderText: {
		fontSize: 12,
		fontWeight: "bold",
		color: "#1e40af",
	},
	subtotalRow: {
		flexDirection: "row",
		backgroundColor: "#f8f9fa",
		borderBottomWidth: 2,
		borderBottomColor: "#cbd5e1",
		paddingVertical: 8,
		paddingHorizontal: 10,
	},
	subtotalText: {
		fontSize: 10,
		fontWeight: "bold",
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
	yearHeader: {
		backgroundColor: "#dbeafe",
		padding: 12,
		marginTop: 20,
		marginBottom: 10,
		borderRadius: 4,
	},
	yearHeaderText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#1e40af",
		textAlign: "center",
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
	// Colunas para relatório analítico
	colDate: {
		flex: 1,
		textAlign: "left",
	},
	colDescription: {
		flex: 2.5,
		textAlign: "left",
	},
	colCategory: {
		flex: 1.5,
		textAlign: "left",
	},
	colClassification: {
		flex: 1.5,
		textAlign: "left",
	},
	colValue: {
		flex: 1.2,
		textAlign: "right",
	},
});

interface ExpenseReportPDFProps {
	reportData: ExpenseReportData;
	language?: string;
}

export default function ExpenseReportPDF({
	reportData,
	language = "pt",
}: ExpenseReportPDFProps) {
	if (!reportData) {
		return <div>Erro ao carregar os dados do relatório.</div>;
	}

	const locale = language === "es" ? es : ptBR;

	// Traduções baseadas no idioma
	const translations = {
		pt: {
			title: "Relatório de Despesas",
			analyticTitle: "Relatório Analítico de Despesas",
			syntheticTitle: "Relatório Sintético de Despesas",
			period: "Período",
			allYears: "Todos os Anos",
			date: "Data",
			description: "Descrição",
			category: "Categoria",
			classification: "Classificação",
			value: "Valor",
			subtotal: "Subtotal",
			totalExpenses: "Total de Despesas",
			totalValue: "Valor Total",
			generatedAt: "Gerado em",
			month: "Mês",
		},
		es: {
			title: "Informe de Gastos",
			analyticTitle: "Informe Analítico de Gastos",
			syntheticTitle: "Informe Sintético de Gastos",
			period: "Período",
			allYears: "Todos los Años",
			date: "Fecha",
			description: "Descripción",
			category: "Categoría",
			classification: "Clasificación",
			value: "Valor",
			subtotal: "Subtotal",
			totalExpenses: "Total de Gastos",
			totalValue: "Valor Total",
			generatedAt: "Generado en",
			month: "Mes",
		},
	};

	const t =
		translations[language as keyof typeof translations] || translations.pt;

	// Formatar período para exibição
	const getPeriodText = () => {
		if (reportData.month && reportData.year) {
			const date = new Date(
				parseInt(reportData.year),
				reportData.month - 1,
				1
			);
			return format(date, "MMMM 'de' yyyy", { locale });
		} else if (reportData.year) {
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
							<Text style={styles.title}>
								{reportData.reportType === "analitico"
									? t.analyticTitle
									: t.syntheticTitle}
							</Text>
							<Text style={styles.subtitle}>
								{t.period}: {getPeriodText()}
							</Text>
						</View>
					</View>

					{/* Relatório Analítico */}
					{reportData.reportType === "analitico" && (
						<View>
							{reportData.yearGroups.map((yearGroup, yearIndex) => (
								<View key={yearIndex}>
									{/* Cabeçalho do Ano (apenas se houver múltiplos anos) */}
									{reportData.yearGroups.length > 1 && (
										<View style={styles.yearHeader}>
											<Text style={styles.yearHeaderText}>{yearGroup.year}</Text>
										</View>
									)}

									{yearGroup.monthGroups.map((monthGroup, groupIndex) => (
								<View key={groupIndex}>
									{/* Cabeçalho do Mês */}
									<View style={styles.monthHeader}>
										<Text style={styles.monthHeaderText}>
											{monthGroup.monthName} {monthGroup.year}
										</Text>
									</View>

									{/* Tabela de Despesas do Mês */}
									<View style={styles.table}>
										{/* Cabeçalho da Tabela */}
										{groupIndex === 0 && (
											<View style={styles.tableHeader}>
												<Text style={[styles.tableHeaderText, styles.colDate]}>
													{t.date}
												</Text>
												<Text
													style={[styles.tableHeaderText, styles.colDescription]}
												>
													{t.description}
												</Text>
												<Text
													style={[styles.tableHeaderText, styles.colCategory]}
												>
													{t.category}
												</Text>
												<Text
													style={[
														styles.tableHeaderText,
														styles.colClassification,
													]}
												>
													{t.classification}
												</Text>
												<Text style={[styles.tableHeaderText, styles.colValue]}>
													{t.value}
												</Text>
											</View>
										)}

										{/* Linhas de Despesas */}
										{monthGroup.expenses.map((expense, expenseIndex) => (
											<View style={styles.tableRow} key={expenseIndex}>
												<Text style={[styles.tableCell, styles.colDate]}>
													{format(new Date(expense.data), "dd/MM/yyyy", {
														locale,
													})}
												</Text>
												<Text style={[styles.tableCell, styles.colDescription]}>
													{expense.descricao}
												</Text>
												<Text style={[styles.tableCell, styles.colCategory]}>
													{expense.categoria}
												</Text>
												<Text
													style={[styles.tableCell, styles.colClassification]}
												>
													{expense.classificacao}
												</Text>
												<Text style={[styles.tableCell, styles.colValue]}>
													{formatCurrency(expense.valor)}
												</Text>
											</View>
										))}
									</View>

									{/* Linha de Subtotal do Mês */}
									<View style={styles.subtotalRow}>
										<Text style={[styles.subtotalText, { flex: 1 }]}>
											{t.subtotal} - {monthGroup.monthName} {monthGroup.year}
										</Text>
										<Text style={styles.subtotalText}>
											{formatCurrency(monthGroup.subtotal)}
										</Text>
									</View>
								</View>
							))}

							{/* Linha de Subtotal do Ano (apenas se houver múltiplos anos) */}
							{reportData.yearGroups.length > 1 && (
								<View style={styles.yearSubtotalRow}>
									<Text style={[styles.yearSubtotalText, { flex: 1 }]}>
										{t.subtotal} - {yearGroup.year}
									</Text>
									<Text style={styles.yearSubtotalText}>
										{formatCurrency(yearGroup.yearSubtotal)}
									</Text>
								</View>
							)}
						</View>
					))}
						</View>
					)}

					{/* Relatório Sintético */}
					{reportData.reportType === "sintetico" && (
						<View style={styles.table}>
							{/* Cabeçalho */}
							<View style={styles.tableHeader}>
								<Text style={[styles.tableHeaderText, { flex: 1 }]}>
									{t.month}
								</Text>
								<Text style={[styles.tableHeaderText, { flex: 1 }]}>
									{t.totalExpenses}
								</Text>
								<Text
									style={[
										styles.tableHeaderText,
										{ flex: 1, textAlign: "right" },
									]}
								>
									{t.totalValue}
								</Text>
							</View>

							{/* Linhas de resumo por mês */}
							{reportData.yearGroups.map((yearGroup) =>
								yearGroup.monthGroups.map((monthGroup, index) => (
									<View style={styles.tableRow} key={`${yearGroup.year}-${index}`}>
										<Text style={[styles.tableCell, { flex: 1 }]}>
											{monthGroup.monthName} {monthGroup.year}
										</Text>
										<Text style={[styles.tableCell, { flex: 1 }]}>
											{monthGroup.expenses.length}
										</Text>
										<Text
											style={[styles.tableCell, { flex: 1, textAlign: "right" }]}
										>
											{formatCurrency(monthGroup.subtotal)}
										</Text>
									</View>
								))
							)}
						</View>
					)}

					{/* Totais */}
					<View style={styles.totalRow}>
						<Text style={styles.totalText}>
							{t.totalExpenses}: {reportData.totalExpenses}
						</Text>
						<Text style={styles.totalText}>
							{t.totalValue}: {formatCurrency(reportData.totalValue)}
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
