import { Routes, Route } from 'react-router-dom';
import ListarSubCategoriaDespesas from './ListarSubCategoriaDespesas';
import FormularioSubCategoriaDespesas from './FormularioSubCategoriaDespesas';

export default function SubCategoriaDespesas() {
  return (
    <Routes>
      <Route index element={<ListarSubCategoriaDespesas />} />
      <Route path="criar" element={<FormularioSubCategoriaDespesas />} />
      <Route path="editar/:idSubCategoria" element={<FormularioSubCategoriaDespesas />} />
    </Routes>
  );
}