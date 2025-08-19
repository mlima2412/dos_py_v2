import { Routes, Route } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { ListarDespesas } from "./correntes/ListarDespesas";
import { FormularioDespesa } from "./correntes/FormularioDespesa";
import { ContasPagarEmConstrucao } from "./contas-pagar/EmConstrucao";
import { DespesasRecorrentesEmConstrucao } from "./recorrentes/EmConstrucao";

export function DespesasPage() {
	return (
		<Routes>
			<Route
				index
				element={<Dashboard />}
			/>
			<Route
				path='correntes'
				element={<ListarDespesas />}
			/>
			<Route
				path='correntes/novo'
				element={<FormularioDespesa />}
			/>
			<Route
				path='novo'
				element={<FormularioDespesa />}
			/>
			<Route
				path='editar/:id'
				element={<FormularioDespesa />}
			/>
			<Route
				path='visualizar/:id'
				element={<FormularioDespesa />}
			/>
			<Route
				path='contas-pagar'
				element={<ContasPagarEmConstrucao />}
			/>
			<Route
				path='recorrentes'
				element={<DespesasRecorrentesEmConstrucao />}
			/>
		</Routes>
	);
}

export default DespesasPage;
