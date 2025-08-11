import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import { PartnerProvider } from './contexts/PartnerContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Inicio } from './pages/Inicio';
import { ListarUsuarios } from './pages/usuarios';
import { FormularioUsuario } from './pages/usuarios/FormularioUsuario';
import Parceiros from './pages/parceiros';
import CanaisOrigem from './pages/canais-origem';
import { CategoriaDespesas } from './pages/categoria-despesas';
import { SubCategoriaDespesas } from './pages/subcategoria-despesas';
import { NotFound } from './pages/NotFound';

import { ThemeProvider } from './components/theme-provider';
import './i18n';
import 'react-toastify/dist/ReactToastify.css';

// Criar instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PartnerProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Router future={{ v7_startTransition: true }}>
            <div className="relative min-h-screen">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inicio"
                  element={
                    <ProtectedRoute>
                      <Inicio />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute>
                      <ListarUsuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios/criar"
                  element={
                    <ProtectedRoute>
                      <FormularioUsuario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios/editar/:publicId"
                  element={
                    <ProtectedRoute>
                      <FormularioUsuario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parceiros/*"
                  element={
                    <ProtectedRoute>
                      <Parceiros />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/canais-origem/*"
                  element={
                    <ProtectedRoute>
                      <CanaisOrigem />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tipos-despesa/*"
                  element={
                    <ProtectedRoute>
                      <CategoriaDespesas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subtipos-despesa/*"
                  element={
                    <ProtectedRoute>
                      <SubCategoriaDespesas />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/inicio" replace />} />
                {/* Rota 404 - deve ser a última */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </div>
          </Router>
          </ThemeProvider>
        </PartnerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
