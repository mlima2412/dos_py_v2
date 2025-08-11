import { Routes, Route } from 'react-router-dom';
import ListarCategoriaDespesas from './ListarCategoriaDespesas.tsx';
import FormularioCategoriaDespesas from './FormularioCategoriaDespesas.tsx';

export default function CategoriaDespesas() {
  return (
    <Routes>
      <Route index element={<ListarCategoriaDespesas />} />
      <Route path="criar" element={<FormularioCategoriaDespesas />} />
      <Route path="editar/:idCategoria" element={<FormularioCategoriaDespesas />} />
    </Routes>
  );
}