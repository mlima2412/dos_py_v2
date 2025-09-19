import { Routes, Route } from "react-router-dom";
import { ListarConferencias } from "./ListarConferencias";
import { NovaConferencia } from "./NovaConferencia";
import { VisualizarConferencia } from "./VisualizarConferencia";

export function ConferenciaRoutes() {
	return (
		<Routes>
			<Route index element={<ListarConferencias />} />
			<Route path="novo" element={<NovaConferencia />} />
			<Route path="visualizar/:id" element={<VisualizarConferencia />} />
		</Routes>
	);
}
