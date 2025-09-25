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
		fontSize: 12,
		fontWeight: "bold",
		width: "30%",
	},
	infoValue: {
		fontSize: 12,
		width: "65%",
	},
	locationsSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 15,
	},
	locationCard: {
		width: "48%",
		borderWidth: 1,
		borderColor: "#e4e4e4",
		padding: 10,
	},
	locationTitle: {
		fontSize: 12,
		fontWeight: "bold",
		marginBottom: 5,
	},
	locationInfo: {
		fontSize: 10,
		marginBottom: 3,
	},
	statusSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
		padding: 10,
		backgroundColor: "#f8f9fa",
		borderRadius: 5,
	},
	statusLabel: {
		fontSize: 12,
		fontWeight: "bold",
	},
	statusValue: {
		fontSize: 12,
		padding: 4,
		borderRadius: 3,
		textAlign: "center",
		minWidth: 80,
	},
	statusReceived: {
		backgroundColor: "#d4edda",
		color: "#155724",
	},
	statusPending: {
		backgroundColor: "#fff3cd",
		color: "#856404",
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
		fontSize: 12,
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
		flex: 0.5, // Contador
	},
	column2: {
		flex: 2, // Nome do produto
		textAlign: "left",
	},
	column3: {
		flex: 1, // Cor
	},
	column4: {
		flex: 1, // Tamanho
	},
	column5: {
		flex: 1, // Quantidade
	},
	column6: {
		flex: 1, // Valor do produto
		textAlign: "right",
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

export type TransferenciaPrint = {
	id: number;
	publicId: string;
	dataTransferencia: string;
	dataRecebimento?: string;
	valorTotal: number;
	localOrigem: {
		nome: string;
		descricao?: string;
	};
	localDestino: {
		nome: string;
		descricao?: string;
	};
	enviadoPorUsuario: {
		nome: string;
	};
	recebidoPorUsuario?: {
		nome: string;
	};
	itens: {
		produto: string;
		cor: string;
		tamanho: string;
		quantidade: number;
		valorProduto: number;
	}[];
};

interface TransferenciaPDFProps {
	transferenciaData: TransferenciaPrint;
	language?: string;
	currencyLocale?: string;
	currencyIsoCode?: string;
}

export default function TransferenciaPDF({
	transferenciaData,
	language = "pt",
	currencyLocale = "pt-BR",
	currencyIsoCode = "BRL",
}: TransferenciaPDFProps) {
	if (!transferenciaData) {
		return <div>Erro ao carregar os dados da transferência.</div>;
	}

	const totalItems = transferenciaData.itens.reduce(
		(total, item) => total + item.quantidade,
		0
	);

	const locale = language === "es" ? es : ptBR;
	const isReceived = !!transferenciaData.dataRecebimento;

	// Traduções baseadas no idioma
	const translations = {
		pt: {
			title: "Transferência de Estoque",
			date: "Data da Transferência",
			receivedDate: "Data de Recebimento",
			status: "Status",
			received: "Recebido",
			pending: "Pendente",
			source: "Local de Origem",
			destination: "Local de Destino",
			sentBy: "Enviado por",
			receivedBy: "Recebido por",
			items: "Itens Transferidos",
			product: "Produto",
			color: "Cor",
			size: "Tamanho",
			quantity: "Quantidade",
			unitValue: "Valor Unit.",
			totalItems: "Total de Itens",
			totalValue: "Valor Total",
			generatedAt: "Gerado em",
		},
		es: {
			title: "Transferencia de Inventario",
			date: "Fecha de Transferencia",
			receivedDate: "Fecha de Recepción",
			status: "Estado",
			received: "Recibido",
			pending: "Pendiente",
			source: "Local de Origen",
			destination: "Local de Destino",
			sentBy: "Enviado por",
			receivedBy: "Recibido por",
			items: "Items Transferidos",
			product: "Producto",
			color: "Color",
			size: "Tamaño",
			quantity: "Cantidad",
			unitValue: "Valor Unit.",
			totalItems: "Total de Items",
			totalValue: "Valor Total",
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
							{t.title} - {transferenciaData.id.toString().padStart(4, "0")}
						</Text>
					</View>

					{/* Informações Básicas */}
					<View style={styles.infoSection}>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.date}:</Text>
							<Text style={styles.infoValue}>
								{format(
									new Date(transferenciaData.dataTransferencia),
									"dd/MM/yyyy HH:mm",
									{
										locale,
									}
								)}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.receivedDate}:</Text>
							<Text style={styles.infoValue}>
								{transferenciaData.dataRecebimento
									? format(
											new Date(transferenciaData.dataRecebimento),
											"dd/MM/yyyy HH:mm",
											{
												locale,
											}
										)
									: t.pending}
							</Text>
						</View>
					</View>

					{/* Status */}
					<View style={styles.statusSection}>
						<Text style={styles.statusLabel}>{t.status}:</Text>
						<Text
							style={[
								styles.statusValue,
								isReceived ? styles.statusReceived : styles.statusPending,
							]}
						>
							{isReceived ? t.received : t.pending}
						</Text>
					</View>

					{/* Locais de Origem e Destino */}
					<View style={styles.locationsSection}>
						<View style={styles.locationCard}>
							<Text style={styles.locationTitle}>{t.source}</Text>
							<Text style={styles.locationInfo}>
								{transferenciaData.localOrigem.nome}
							</Text>
							{transferenciaData.localOrigem.descricao && (
								<Text style={styles.locationInfo}>
									{transferenciaData.localOrigem.descricao}
								</Text>
							)}
						</View>
						<View style={styles.locationCard}>
							<Text style={styles.locationTitle}>{t.destination}</Text>
							<Text style={styles.locationInfo}>
								{transferenciaData.localDestino.nome}
							</Text>
							{transferenciaData.localDestino.descricao && (
								<Text style={styles.locationInfo}>
									{transferenciaData.localDestino.descricao}
								</Text>
							)}
						</View>
					</View>

					{/* Usuários */}
					<View style={styles.infoSection}>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.sentBy}:</Text>
							<Text style={styles.infoValue}>
								{transferenciaData.enviadoPorUsuario.nome}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>{t.receivedBy}:</Text>
							<Text style={styles.infoValue}>
								{transferenciaData.recebidoPorUsuario?.nome || t.pending}
							</Text>
						</View>
					</View>

					{/* Tabela de Itens */}
					<View style={styles.table}>
						{/* Cabeçalho da Tabela */}
						<View style={styles.tableHeader}>
							<Text style={[styles.tableHeaderText, styles.column1]}>#</Text>
							<Text style={[styles.tableHeaderText, styles.column2]}>
								{t.product}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column3]}>
								{t.color}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column4]}>
								{t.size}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column5]}>
								{t.quantity}
							</Text>
							<Text style={[styles.tableHeaderText, styles.column6]}>
								{t.unitValue}
							</Text>
						</View>
						{/* Linhas da Tabela */}
						{transferenciaData.itens.map((item, index) => (
							<View style={styles.tableRow} key={index}>
								<Text style={[styles.tableCell, styles.column1]}>
									{index + 1}
								</Text>
								<Text style={[styles.tableCell, styles.column2]}>
									{item.produto}
								</Text>
								<Text style={[styles.tableCell, styles.column3]}>
									{item.cor}
								</Text>
								<Text style={[styles.tableCell, styles.column4]}>
									{item.tamanho}
								</Text>
								<Text style={[styles.tableCell, styles.column5]}>
									{item.quantidade}
								</Text>
								<Text style={[styles.tableCell, styles.column6]}>
									{item.valorProduto.toLocaleString(currencyLocale, {
										style: "currency",
										currency: currencyIsoCode,
									})}
								</Text>
							</View>
						))}
					</View>

					{/* Totais */}
					<View style={styles.totalRow}>
						<Text style={styles.totalText}>
							{t.totalItems}: {totalItems}
						</Text>
						<Text style={styles.totalText}>
							{t.totalValue}:{" "}
							{transferenciaData.valorTotal.toLocaleString(currencyLocale, {
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
