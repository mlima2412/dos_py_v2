import { Routes, Route } from "react-router-dom";
import { ListagemVendas } from "./ListagemVendas";
import { FormularioVenda } from "./FormularioVenda";

export function VendasRoutes() {
	return (
		<Routes>
			<Route index element={<ListagemVendas tipo="all" />} />
			<Route path="pedidos" element={<ListagemVendas tipo="pedido" />} />
			<Route path="vendas" element={<ListagemVendas tipo="venda" />} />
			<Route
				path="condicionais"
				element={<ListagemVendas tipo="condicional" />}
			/>
			<Route path="brinde" element={<ListagemVendas tipo="brinde" />} />
			<Route
				path="parcelamentos"
				element={<ListagemVendas tipo="parcelamento" />}
			/>
			<Route path="novo" element={<FormularioVenda mode="create" />} />
			<Route
				path="editar/:publicId"
				element={<FormularioVenda mode="edit" />}
			/>
			<Route
				path="visualizar/:publicId"
				element={<FormularioVenda mode="view" />}
			/>
		</Routes>
	);
}

export default VendasRoutes;
