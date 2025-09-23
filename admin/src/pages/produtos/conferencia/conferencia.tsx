import { Routes, Route } from "react-router-dom";
import { ListarConferencias } from "./ListarConferencias";
import { ConferenciaPage } from "./ConferenciaPage";

export function ConferenciaRoutes() {
	return (
		<Routes>
			<Route index element={<ListarConferencias />} />
			<Route path="novo" element={<ConferenciaPage />} />
			<Route path="visualizar/:id" element={<ConferenciaPage />} />
		</Routes>
	);
}
