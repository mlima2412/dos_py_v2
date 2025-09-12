import { Routes, Route } from "react-router-dom";
import { ListarCategoriasProduto } from "./ListarCategoriasProduto";
import { EditarCategoriaProduto } from "./EditarCategoriaProduto";

export function CategoriasProdutoRoutes() {
	return (
		<Routes>
			<Route index element={<ListarCategoriasProduto />} />
			<Route path="editar/:id" element={<EditarCategoriaProduto />} />
		</Routes>
	);
}
