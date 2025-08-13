import { Routes, Route } from 'react-router-dom';
import { ListarDespesas } from './ListarDespesas';
import { FormularioDespesa } from './FormularioDespesa';

export function DespesasPage() {
  return (
    <Routes>
      <Route index element={<ListarDespesas />} />
      <Route path="novo" element={<FormularioDespesa />} />
      <Route path="editar/:id" element={<FormularioDespesa />} />
    </Routes>
  );
}

export default DespesasPage;