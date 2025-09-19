import { Routes, Route } from "react-router-dom";
import { ListarProdutos } from "./ListarProdutos";
import { FormularioProduto } from "./FormularioProduto";
import { TransferenciaEstoque } from "./transferencia";
import { ListarTransferencias } from "./transferencia/ListarTransferencias";
import { VisualizarTransferencia } from "./transferencia/VisualizarTransferencia";

export function ProdutosRoutes() {
	return (
		<Routes>
			<Route index element={<ListarProdutos />} />
			<Route path="novo" element={<FormularioProduto />} />
			<Route path="editar/:id" element={<FormularioProduto />} />
			<Route path="visualizar/:id" element={<FormularioProduto />} />
			<Route path="transferencia" element={<TransferenciaEstoque />} />
			<Route path="listar-transferencia" element={<ListarTransferencias />} />
			<Route
				path="transferencia/visualizar/:publicId"
				element={<VisualizarTransferencia />}
			/>
		</Routes>
	);
}
