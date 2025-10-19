import { Routes, Route } from "react-router-dom";
import { ListagemVendas } from "./ListagemVendas";
import { FormularioVenda } from "./FormularioVenda";

export function VendasRoutes() {
	return (
		<Routes>
			<Route index element={<ListagemVendas />} />
			<Route path="novo" element={<FormularioVenda mode="create" />} />
			<Route path="editar/:publicId" element={<FormularioVenda mode="edit" />} />
			<Route
				path="visualizar/:publicId"
				element={<FormularioVenda mode="view" />}
			/>
		</Routes>
	);
}

export default VendasRoutes;
