import { Routes, Route } from "react-router-dom";
import { ListarCanaisOrigem } from "./ListarCanaisOrigem";
import { FormularioCanalOrigem } from "./FormularioCanalOrigem";

export default function CanaisOrigem() {
	return (
		<Routes>
			<Route index element={<ListarCanaisOrigem />} />
			<Route path="novo" element={<FormularioCanalOrigem />} />
			<Route path="editar/:publicId" element={<FormularioCanalOrigem />} />
		</Routes>
	);
}
