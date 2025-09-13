import { Routes, Route } from "react-router-dom";
import { ListarProdutos } from "./ListarProdutos";

export function ProdutosRoutes() {
	return (
		<Routes>
			<Route index element={<ListarProdutos />} />
		</Routes>
	);
}
