import { Routes, Route } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { ListarDespesas } from "./correntes/ListarDespesas";
import { FormularioDespesa } from "./correntes/FormularioDespesa";
import { ContasPagarCalendar } from "./contas-pagar/ContasPagarCalendar";
import { ListarDespesasRecorrentes } from "./recorrentes/ListarDespesasRecorrentes";
import { FormularioDespesaRecorrente } from "./recorrentes/FormularioDespesaRecorrente";
import { ExpenseReportPrintPage } from "./print/ExpenseReportPrintPage";
import { ExpenseReportsPage } from "./RelatoriosDespesas";

export function DespesasPage() {
	return (
		<Routes>
			<Route index element={<Dashboard />} />
			<Route path="correntes" element={<ListarDespesas />} />
			<Route path="correntes/novo" element={<FormularioDespesa />} />
			<Route path="novo" element={<FormularioDespesa />} />
			<Route path="editar/:id" element={<FormularioDespesa />} />
			<Route path="visualizar/:id" element={<FormularioDespesa />} />
			<Route path="contas-pagar" element={<ContasPagarCalendar />} />
			<Route path="recorrentes" element={<ListarDespesasRecorrentes />} />
			<Route
				path="recorrentes/novo"
				element={<FormularioDespesaRecorrente />}
			/>
			<Route
				path="recorrentes/editar/:id"
				element={<FormularioDespesaRecorrente />}
			/>
			<Route
				path="recorrentes/visualizar/:id"
				element={<FormularioDespesaRecorrente />}
			/>
			<Route path="relatorios" element={<ExpenseReportsPage />} />
			<Route path="relatorio/imprimir" element={<ExpenseReportPrintPage />} />
		</Routes>
	);
}

export default DespesasPage;
