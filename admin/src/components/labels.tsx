// src/labels.tsx
import React from "react";
import {
	Document,
	Page,
	Text,
	View,
	Image,
	StyleSheet,
} from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";
import type { EtiquetaPedidoCompraDto } from "@/api-client/types";

const styles = StyleSheet.create({
	page: {
		width: 113.4, // 4 cm
		height: 85.05, // 3 cm
		padding: 1, // margem interna de 1pt
	},
	box: {
		flex: 1,
		border: "1pt solid black",
		padding: 2,
		flexDirection: "column",
		justifyContent: "space-between",
	},
	barcodeBox: {
		// flexGrow: 1, // ocupa todo espaço vertical possível
		border: "1pt solid black", // retângulo ao redor
		justifyContent: "center", // centraliza verticalmente
		alignItems: "center", // centraliza horizontalmente
		marginVertical: 2,
		padding: 2,
	},
	barcodeImg: {
		width: "85%", // ocupa 90% da largura do box
		height: "auto",
		objectFit: "contain", // garante que não deforma
	},
	textCenter: {
		textAlign: "center",
		fontSize: 8,
	},
	textRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		fontSize: 8,
		fontWeight: "bold",
	},
	textRowValue: {
		flexDirection: "row",
		fontSize: 5,
	},
});

// -------------------
// Barcode generator
// -------------------
function generateBarcodeBase64(value: string): string {
	const canvas = createCanvas(300, 100); // resolução interna
	JsBarcode(canvas, value, {
		format: "CODE128",
		displayValue: false,
		margin: 0,
	});
	return canvas.toDataURL("image/png");
}

// -------------------
// Label Component
// -------------------
const Label: React.FC<{ data: EtiquetaPedidoCompraDto }> = ({ data }) => {
	// Criar código do produto concatenando id_produto e id_sku
	// Com o formato XXX-YYY
	const codigo = `${data.id_produto.toString().padStart(3, "0")}-${data.id_sku.toString().padStart(3, "0")}`;
	const barcode = generateBarcodeBase64(codigo);

	return (
		<Page size={{ width: 113.4, height: 85.05 }} style={styles.page}>
			<View>
				<Text style={styles.textCenter}>{data.nome}</Text>
				<View style={styles.barcodeBox}>
					<Image style={styles.barcodeImg} src={barcode} />
					<Text style={styles.textRowValue}>{codigo}</Text>
				</View>
				<View style={styles.textRow}>
					<Text>
						{data.cor || "-"} - {data.tamanho || "-"}
					</Text>
					<Text>{data.preco}</Text>
				</View>
			</View>
		</Page>
	);
};

export const LabelsDocument: React.FC<{ items: EtiquetaPedidoCompraDto[] }> = ({
	items,
}) => (
	<Document>
		{items.map((item, idx) => (
			<Label key={idx} data={item} />
		))}
	</Document>
);
