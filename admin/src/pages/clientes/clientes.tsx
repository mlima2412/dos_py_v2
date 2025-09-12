import { Routes, Route } from "react-router-dom";
import { ListarClientes } from "./ListarClientes";
import { FormularioCliente } from "./FormularioCliente";

export function ClientesRoutes() {
	return (
		<Routes>
			<Route index element={<ListarClientes />} />
			<Route path="novo" element={<FormularioCliente />} />
			<Route path="editar/:id" element={<FormularioCliente />} />
			<Route path="visualizar/:id" element={<FormularioCliente />} />
		</Routes>
	);
}
