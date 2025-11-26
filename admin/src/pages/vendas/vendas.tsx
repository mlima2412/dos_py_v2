import { Routes, Route } from "react-router-dom";
import { ListagemVendas } from "./ListagemVendas";
import { FormularioVenda } from "./FormularioVenda";
import { ListagemParcelamentos } from "./ListagemParcelamentos";
import { VisualizarParcelamento } from "./VisualizarParcelamento";
import { DashboardVendas } from "./DashboardVendas";
import { SalesReportPrintPage } from "./print/SalesReportPrintPage";

export function VendasRoutes() {
	return (
		<Routes>
			<Route index element={<ListagemVendas tipo="all" />} />
			<Route path="dashboard" element={<DashboardVendas />} />
			<Route path="pedidos" element={<ListagemVendas tipo="pedido" />} />
			<Route path="vendas" element={<ListagemVendas tipo="venda" />} />
			<Route
				path="condicionais"
				element={<ListagemVendas tipo="condicional" />}
			/>
			<Route path="brinde" element={<ListagemVendas tipo="brindePermuta" />} />
			<Route path="parcelamentos" element={<ListagemParcelamentos />} />
			<Route
				path="parcelamentos/visualizar/:id"
				element={<VisualizarParcelamento />}
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
			<Route path="relatorio/imprimir" element={<SalesReportPrintPage />} />
		</Routes>
	);
}

export default VendasRoutes;
