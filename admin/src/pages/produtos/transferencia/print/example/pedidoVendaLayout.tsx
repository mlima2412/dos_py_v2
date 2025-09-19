import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
	Page,
	Text,
	View,
	Document,
	StyleSheet,
	PDFViewer,
} from "@react-pdf/renderer";

import { Image as PDFImage } from "@react-pdf/renderer"; // Alias aplicado aqui é para evitar conflito com o Lint do Next.js

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
		marginBottom: 5,
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
	info: {
		fontSize: 12,
		marginBottom: 5,
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
		padding: 5,
		flex: 1,
		textAlign: "center",
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#e4e4e4",
	},
	tableCell: {
		fontSize: 10,
		padding: 5,
		flex: 1,
		textAlign: "center",
	},
	column1: {
		flex: 1, // Estreito
	},
	codprod: {
		flex: 1, // Estreito
		textAlign: "center",
	},
	codprodheader: {
		flex: 1, // Estreito
		textAlign: "center",
	},
	column2: {
		flex: 3, // Mais espaço
		textAlign: "left",
	},
	column3: {
		flex: 1, // Proporcionalmente norma
	},
	column4: {
		flex: 1, // Proporcionalmente normal
	},
	column5: {
		flex: 1, // Proporcionalmente normal
	},
	tableFooter: {
		fontWeight: "bold",
		marginTop: 10,
	},
	totalRow: {
		flexDirection: "row",
		marginTop: 10,
		justifyContent: "space-between",
	},
	totalText: {
		fontSize: 12,
		fontWeight: "bold",
		textAlign: "left",
	},
});

// // Dados fictícios
export type PedidoPrint = {
	idVenda: number;
	dataVenda: string;
	valorTotal: number;
	tipoVenda: string;
	cliente: {
		nome: string;
	};
	itensVenda: {
		produto: {
			idProduto: number;
			idVariante: number;
			nome: string;
		};
		cor: string;
		tamanho: string;
		qtd: number;
		precoVenda: number;
	}[];
};

export default function PedidoVendaPDF<Partial>(pedidoData: PedidoPrint) {
	if (pedidoData === undefined)
		return <div>Erro ao carregar os dados do pedido.</div>;
	const totalQuantidade = pedidoData.itensVenda.reduce(
		(acc, item) => acc + item.qtd,
		0
	);
	const totalValor = pedidoData.itensVenda.reduce(
		(acc, item) => acc + item.qtd * item.precoVenda,
		0
	);

	return (
		<PDFViewer style={{ width: "100%", height: "100vh" }}>
			<Document>
				<Page
					size='A4'
					style={styles.page}
				>
					{/* Cabeçalho */}
					<View style={styles.header}>
						<PDFImage
							style={styles.logo}
							src={"/logo-central-color.png"}
						/>
						<Text
							style={styles.title}
						>{`${pedidoData.tipoVenda}:${pedidoData.idVenda}`}</Text>
					</View>

					{/* Informações do Pedido */}
					<View>
						<Text style={styles.info}>
							Fecha de Pedido:{" "}
							{format(new Date(pedidoData.dataVenda), "dd/MM/yyyy", {
								locale: ptBR,
							})}
						</Text>
						<Text style={styles.info}>Cliente: {pedidoData.cliente.nome}</Text>
					</View>
					{/* Tabela */}
					<View style={styles.table}>
						{/* Cabeçalho da Tabela */}
						<View style={styles.tableHeader}>
							<Text style={[styles.tableHeaderText, styles.column1]}>#</Text>
							<Text style={[styles.tableHeaderText, styles.codprodheader]}>
								COD
							</Text>
							<Text style={[styles.tableHeaderText, styles.column2]}>
								Producto
							</Text>
							<Text style={[styles.tableHeaderText, styles.column3]}>Cor</Text>
							<Text style={[styles.tableHeaderText, styles.column3]}>Tam</Text>
							<Text style={[styles.tableHeaderText, styles.column3]}>Qtd</Text>
							<Text style={[styles.tableHeaderText, styles.column4]}>
								Valor unidad
							</Text>
							<Text style={[styles.tableHeaderText, styles.column5]}>
								Total
							</Text>
						</View>
						{/* Linhas da Tabela */}
						{pedidoData.itensVenda.map((item, index) => (
							<View
								style={styles.tableRow}
								key={index}
							>
								<Text style={[styles.tableCell, styles.column1]}>
									{index + 1}
								</Text>
								<Text style={[styles.tableCell, styles.codprod]}>
									{item.produto.idProduto.toString().padStart(3, "0")}-
									{item.produto.idVariante.toString().padStart(3, "0")}
								</Text>
								<Text style={[styles.tableCell, styles.column2]}>
									{item.produto.nome}
								</Text>
								<Text style={[styles.tableCell, styles.column3]}>
									{item.cor}
								</Text>
								<Text style={[styles.tableCell, styles.column3]}>
									{item.tamanho}
								</Text>
								<Text style={[styles.tableCell, styles.column3]}>
									{item.qtd}
								</Text>
								<Text style={[styles.tableCell, styles.column4]}>
									{item.precoVenda.toLocaleString("es-PY", {
										style: "currency",
										currency: "PYG",
									})}
								</Text>
								<Text style={[styles.tableCell, styles.column5]}>
									{(item.qtd * item.precoVenda).toLocaleString("es-PY", {
										style: "currency",
										currency: "PYG",
									})}
								</Text>
							</View>
						))}
					</View>

					{/* Totais */}
					<View style={styles.totalRow}>
						<Text style={styles.totalText}>
							Unidades total: {totalQuantidade}
						</Text>
					</View>
					<View>
						<Text style={styles.totalText}>
							Total:{" "}
							{totalValor.toLocaleString("es-PY", {
								style: "currency",
								currency: "PYG",
							})}
						</Text>
					</View>
				</Page>
			</Document>
		</PDFViewer>
	);
}
