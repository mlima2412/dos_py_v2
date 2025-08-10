import { Routes, Route } from 'react-router-dom';
import ListarParceiros from './ListarParceiros';
import { FormularioParceiro } from './FormularioParceiro';

export default function Parceiros() {
  return (
    <Routes>
      <Route index element={<ListarParceiros />} />
      <Route path="criar" element={<FormularioParceiro />} />
      <Route path="editar/:publicId" element={<FormularioParceiro />} />
    </Routes>
  );
}