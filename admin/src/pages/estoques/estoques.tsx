import { Routes, Route } from "react-router-dom";
import { ListarEstoques } from "./ListarEstoques";
import { CriarEditarLocalEstoque } from "./CriarEditarLocalEstoque";

export function EstoquesRoutes() {
	return (
		<Routes>
			<Route index element={<ListarEstoques />} />
			<Route path="novo" element={<CriarEditarLocalEstoque mode="create" />} />
			<Route
				path=":id/editar"
				element={<CriarEditarLocalEstoque mode="edit" />}
			/>
			<Route
				path=":id/visualizar"
				element={<CriarEditarLocalEstoque mode="view" />}
			/>
		</Routes>
	);
}
