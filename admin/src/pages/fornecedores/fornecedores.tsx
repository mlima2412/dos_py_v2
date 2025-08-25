import { Routes, Route } from "react-router-dom";
import { ListarFornecedores } from "./ListarFornecedores";
import { FormularioFornecedor } from "./FormularioFornecedor";

export function FornecedoresRoutes() {
	return (
		<Routes>
			<Route index element={<ListarFornecedores />} />
			<Route path="criar" element={<FormularioFornecedor />} />
			<Route path="editar/:publicId" element={<FormularioFornecedor />} />
		</Routes>
	);
}
