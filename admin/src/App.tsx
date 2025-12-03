import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./contexts/AuthContext";
import { PartnerProvider } from "./contexts/PartnerContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/auth/Login";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Inicio } from "./pages/Inicio";
import { ListarUsuarios } from "./pages/usuarios";
import { FormularioUsuario } from "./pages/usuarios/FormularioUsuario";
import Parceiros from "./pages/parceiros";
import CanaisOrigem from "./pages/canais-origem";
import { CategoriaDespesas } from "./pages/categoria-despesas";
import { SubCategoriaDespesas } from "./pages/subcategoria-despesas";
import DespesasPage from "./pages/despesas";
import { FornecedoresRoutes } from "./pages/fornecedores/fornecedores";
import { NotFound } from "./pages/NotFound";
import { ClientesRoutes } from "./pages/clientes/clientes";
import { CategoriasProdutoRoutes } from "./pages/produtos/categorias/categorias";
import { ProdutosRoutes } from "./pages/produtos/produtos";
import { EstoquesRoutes } from "./pages/produtos/estoques";
import { ListarFormasPagamento } from "./pages/formas-pagamento";
import { FormularioFormaPagamento } from "./pages/formas-pagamento/FormularioFormaPagamento";
import { PedidoCompraPage } from "./pages/pedido-compra/pedido-compra";
import {
	FormularioPedidoCompra,
	FinalizarPedidoCompra,
	ImprimirEtiquetas,
} from "./pages/pedido-compra";
import { PedidoCompraPrintPage } from "./pages/pedido-compra/print";
import { VendasRoutes } from "./pages/vendas/vendas";
import { RelatorioDRE } from "./pages/dre/RelatorioDRE";
import { DashboardComparativo } from "./pages/financeiro/DashboardComparativo";
import { PlanoContas } from "./pages/financas/PlanoContas";
import { RegrasLancamento } from "./pages/financas/RegrasLancamento";
import { DashboardLayout } from "./components/layout/DashboardLayout";

import { ThemeProvider } from "./components/theme-provider";
import "./i18n";
import "react-toastify/dist/ReactToastify.css";

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
										element={
											<ProtectedRoute>
												<DashboardLayout />
											</ProtectedRoute>
										}
									>
										<Route path="/dashboard" element={<Dashboard />} />
										<Route path="/inicio" element={<Inicio />} />
										<Route path="/usuarios" element={<ListarUsuarios />} />
										<Route path="/usuarios/criar" element={<FormularioUsuario />} />
										<Route
											path="/usuarios/editar/:publicId"
											element={<FormularioUsuario />}
										/>
										<Route path="/parceiros/*" element={<Parceiros />} />
										<Route path="/canais-origem/*" element={<CanaisOrigem />} />
										<Route path="/tipos-despesa/*" element={<CategoriaDespesas />} />
										<Route
											path="/subtipos-despesa/*"
											element={<SubCategoriaDespesas />}
										/>
										<Route path="/despesas/*" element={<DespesasPage />} />
										<Route path="/fornecedores/*" element={<FornecedoresRoutes />} />
										<Route path="/clientes/*" element={<ClientesRoutes />} />
										<Route
											path="/produto/categorias/*"
											element={<CategoriasProdutoRoutes />}
										/>
										<Route path="/produtos/*" element={<ProdutosRoutes />} />
										<Route path="/estoques/*" element={<EstoquesRoutes />} />
										<Route
											path="/formaPagamento"
											element={<ListarFormasPagamento />}
										/>
										<Route
											path="/formaPagamento/criar"
											element={<FormularioFormaPagamento />}
										/>
										<Route
											path="/formaPagamento/editar/:id"
											element={<FormularioFormaPagamento />}
										/>
										<Route
											path="/formaPagamento/visualizar/:id"
											element={<FormularioFormaPagamento />}
										/>
										<Route path="/pedidoCompra" element={<PedidoCompraPage />} />
										<Route
											path="/pedidoCompra/criar"
											element={<FormularioPedidoCompra />}
										/>
										<Route
											path="/pedidoCompra/visualizar/:publicId"
											element={<FormularioPedidoCompra />}
										/>
										<Route
											path="/pedidoCompra/finalizar/:publicId"
											element={<FinalizarPedidoCompra />}
										/>
										<Route
											path="/pedidoCompra/etiquetas/:publicId"
											element={<ImprimirEtiquetas />}
										/>
										<Route
											path="/pedidoCompra/imprimir/:publicId"
											element={<PedidoCompraPrintPage />}
										/>
										<Route path="/pedidoVendas/*" element={<VendasRoutes />} />
										<Route path="/dre" element={<RelatorioDRE />} />
										<Route
											path="/financeiro/comparativo"
											element={<DashboardComparativo />}
										/>
										<Route
											path="/financas/plano-contas"
											element={<PlanoContas />}
										/>
										<Route
											path="/financas/regras-lancamento"
											element={<RegrasLancamento />}
										/>
										<Route path="/" element={<Navigate to="/inicio" replace />} />
									</Route>

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
