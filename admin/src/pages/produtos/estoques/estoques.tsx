import { Routes, Route } from "react-router-dom";
import { ListarEstoques } from "./ListarEstoques";
import { CriarEditarLocalEstoque } from "./CriarEditarLocalEstoque";
import { VisualizarEstoque } from "./VisualizarEstoque";
import { ImprimirEtiquetasEstoque } from "./ImprimirEtiquetas";

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
			<Route path="visualizar" element={<VisualizarEstoque />} />
			<Route
				path="etiquetas/:publicId/:nomeLocal"
				element={<ImprimirEtiquetasEstoque />}
			/>
		</Routes>
	);
}
