import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	ArrowLeft,
	Package,
	User,
	MapPin,
	Calendar,
	Clock,
	Search,
	Play,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";

import { Input } from "@/components/ui/input";
import {
	useConferenciaEstoqueControllerFindOne,
	useConferenciaItemControllerCreate,
	useConferenciaItemControllerUpdate,
	useConferenciaItemControllerFindByConferencia,
	useEstoqueSkuControllerFindByLocal,
} from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { ConferenciaSkuListing } from "./components/ConferenciaSkuListing";

export const VisualizarConferencia: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartnerContext();

	// Estados para continuar conferência
	const [codigoProduto, setCodigoProduto] = useState("");
	const [itensConferidos, setItensConferidos] = useState<Map<number, number>>(
		new Map()
	);

	// Buscar dados da conferência
	const {
		data: conferencia,
		isLoading,
		error,
	} = useConferenciaEstoqueControllerFindOne(
		id || "",
		{
			"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 1,
		},
		{
			query: {
				enabled: !!id,
			},
		}
	);

	// Buscar estoque do local da conferência
	const { data: estoqueLocal } = useEstoqueSkuControllerFindByLocal(
		conferencia?.localEstoqueId || 0,
		{
			query: {
				enabled: !!conferencia?.localEstoqueId,
			},
		}
	);

	// Buscar itens da conferência com dados otimizados
	const { data: itensConferencia, refetch: refetchItens } =
		useConferenciaItemControllerFindByConferencia(conferencia?.id || 0, {
			query: {
				enabled: !!conferencia?.id,
			},
		});

	// Hooks para criar e atualizar itens de conferência
	const createItem = useConferenciaItemControllerCreate();
	const updateItem = useConferenciaItemControllerUpdate();

	// Inicializar itens conferidos com dados existentes
	useMemo(() => {
		if (itensConferencia && itensConferencia.length > 0) {
			const itensMap = new Map<number, number>();
			itensConferencia.forEach(item => {
				itensMap.set(item.skuId, item.qtdConferencia);
			});
			setItensConferidos(itensMap);
		}
	}, [itensConferencia]);

	const handleBack = () => {
		navigate("/produtos/conferencia");
	};

	// Calcular progresso baseado na quantidade total de itens no estoque do local
	const totalItens = estoqueLocal?.length || 0;
	const itensConferidosCount = itensConferencia?.length || 0;
	const progresso =
		totalItens > 0 ? (itensConferidosCount / totalItens) * 100 : 0;

	// Função para processar código do produto
	const handleCodigoProduto = async () => {
		if (!codigoProduto || !conferencia) return;

		// Extrair SKU do código (formato: XXX-YYY)
		const codeParts = codigoProduto.split("-");
		if (codeParts.length !== 2) {
			toast.error("Formato de código inválido. Use XXX-YYY");
			return;
		}

		const skuId = parseInt(codeParts[1]);
		if (isNaN(skuId)) {
			toast.error("SKU inválido");
			return;
		}

		// Verificar se o SKU existe no estoque do local
		const skuNoEstoque = estoqueLocal?.find(item => item.skuId === skuId);
		if (!skuNoEstoque) {
			toast.error("SKU não encontrado no estoque deste local");
			return;
		}

		// Incrementar contador de conferência
		const contadorAtual = itensConferidos.get(skuId) || 0;
		const novoContador = contadorAtual + 1;

		setItensConferidos(prev => new Map(prev.set(skuId, novoContador)));

		// Verificar se já existe um item para este SKU na conferência
		const itemExistente = itensConferencia?.find(item => item.skuId === skuId);

		try {
			if (itemExistente) {
				// Atualizar item existente
				await updateItem.mutateAsync({
					id: itemExistente.id,
					data: {
						qtdConferencia: novoContador,
					},
				});
			} else {
				// Criar novo item
				await createItem.mutateAsync({
					data: {
						conferenciaId: conferencia.id,
						skuId: skuId,
						qtdSistema: skuNoEstoque.qtd,
						qtdConferencia: novoContador,
					},
				});
			}

			setCodigoProduto("");
			toast.success(`Produto conferido! Quantidade: ${novoContador}`);

			// Recarregar lista de itens conferidos
			refetchItens();
		} catch (error) {
			console.error("Erro ao registrar item:", error);
			toast.error("Erro ao registrar item de conferência");
		}
	};

	// Função para processar Enter no campo de código
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleCodigoProduto();
		}
	};

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			const locale = i18n.language === "es" ? es : ptBR;
			return format(date, "dd/MM/yyyy HH:mm", { locale });
		} catch {
			return dateString;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "PENDENTE":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "EM_ANDAMENTO":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "FINALIZADA":
				return "bg-green-100 text-green-800 border-green-200";
			case "CANCELADA":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">{t("common.loading")}</div>
				</div>
			</DashboardLayout>
		);
	}

	if (error || !conferencia) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center py-8">
					<div className="text-destructive">
						{error ? t("common.loadError") : "Conferência não encontrada"}
					</div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Breadcrumb */}
				<div className="flex items-center justify-between">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/inicio">Início</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="/produtos">Produtos</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="/produtos/conferencia">
									Conferências
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Visualizar Conferência</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Button variant="outline" onClick={handleBack}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
				</div>

				{/* Informações da Conferência */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Informações da Conferência
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{/* Status */}
							<div className="flex items-center gap-2">
								<Badge className={getStatusColor(conferencia.status)}>
									{t(`conference.status.${conferencia.status}`)}
								</Badge>
							</div>

							{/* Local de Estoque */}
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Local</p>
									<p className="text-sm text-muted-foreground">
										{conferencia.localNome || "N/A"}
									</p>
								</div>
							</div>

							{/* Usuário Responsável */}
							<div className="flex items-center gap-2">
								<User className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Responsável</p>
									<p className="text-sm text-muted-foreground">
										{typeof conferencia.Usuario === "string"
											? conferencia.Usuario
											: (conferencia.Usuario as any)?.nome || "N/A"}
									</p>
								</div>
							</div>

							{/* Data de Início */}
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Data de Início</p>
									<p className="text-sm text-muted-foreground">
										{formatDate(conferencia.dataInicio)}
									</p>
								</div>
							</div>

							{/* Data de Fim */}
							{conferencia.dataFim && (
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Data de Fim</p>
										<p className="text-sm text-muted-foreground">
											{formatDate(conferencia.dataFim)}
										</p>
									</div>
								</div>
							)}

							{/* ID da Conferência */}
							<div className="flex items-center gap-2">
								<Package className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">ID</p>
									<p className="text-sm text-muted-foreground font-mono">
										{conferencia.publicId}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Área para Continuar Conferência (se não finalizada) */}
				{(conferencia.status === "PENDENTE" ||
					conferencia.status === "EM_ANDAMENTO") && (
					<>
						{/* Barra de Progresso */}
						<Card>
							<CardContent className="pt-6">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Progresso da Conferência</span>
										<span>
											{itensConferidosCount} de {totalItens} itens
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-blue-600 h-2 rounded-full transition-all duration-300"
											style={{ width: `${progresso}%` }}
										></div>
									</div>
									<div className="text-xs text-muted-foreground">
										{progresso.toFixed(1)}% concluído
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Campo de Leitura de Código */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Search className="h-5 w-5" />
									Continuar Conferência
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex gap-2">
									<Input
										placeholder="Digite ou escaneie o código do produto (XXX-YYY)"
										value={codigoProduto}
										onChange={e => setCodigoProduto(e.target.value)}
										onKeyPress={handleKeyPress}
										className="flex-1"
										autoFocus
									/>
									<Button
										onClick={handleCodigoProduto}
										disabled={!codigoProduto}
									>
										<Play className="mr-2 h-4 w-4" />
										Conferir
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Cards lado a lado */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Lista de SKUs */}
							<ConferenciaSkuListing
								localId={conferencia.localEstoqueId}
								estoqueLocal={estoqueLocal}
								itensConferidos={itensConferidos}
								itensConferencia={itensConferencia}
								isLoading={false}
								error={null}
							/>

							{/* Itens da Conferência */}
							<Card>
								<CardHeader>
									<CardTitle>Itens Conferidos</CardTitle>
								</CardHeader>
								<CardContent>
									<ScrollArea className="h-[400px] w-full">
										{itensConferencia && itensConferencia.length > 0 ? (
											<div className="space-y-4 pr-4">
												{itensConferencia.map((item, index) => (
													<div
														key={index}
														className="flex items-center justify-between p-4 border rounded-lg"
													>
														<div className="flex items-center gap-4">
															<div>
																<p className="font-medium">
																	{item.produto?.id && item.skuId
																		? `${item.produto.id.toString().padStart(3, "0")}-${item.skuId.toString().padStart(3, "0")}`
																		: `SKU: ${item.skuId}`}
																</p>
																<p className="text-sm font-medium">
																	{item.produto?.nome ||
																		"Produto não encontrado"}
																</p>
																<p className="text-sm text-muted-foreground">
																	{item.sku?.cor || "N/A"} -{" "}
																	{item.sku?.tamanho || "N/A"}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-4">
															<div className="text-center">
																<p className="text-sm font-medium">Sistema</p>
																<p className="text-lg">{item.qtdSistema}</p>
															</div>
															<div className="text-center">
																<p className="text-sm font-medium">Físico</p>
																<p className="text-lg">{item.qtdConferencia}</p>
															</div>
															<div className="text-center">
																<p className="text-sm font-medium">Diferença</p>
																<p
																	className={`text-lg font-medium ${
																		item.diferenca === 0
																			? "text-green-600"
																			: item.diferenca > 0
																				? "text-blue-600"
																				: "text-red-600"
																	}`}
																>
																	{item.diferenca > 0
																		? `+${item.diferenca}`
																		: item.diferenca}
																</p>
															</div>
															<div className="text-center">
																<p className="text-sm font-medium">Status</p>
																<Badge
																	variant={
																		item.diferenca === 0
																			? "default"
																			: item.diferenca > 0
																				? "secondary"
																				: "destructive"
																	}
																	className={
																		item.diferenca === 0
																			? "bg-green-100 text-green-800"
																			: item.diferenca > 0
																				? "bg-blue-100 text-blue-800"
																				: ""
																	}
																>
																	{item.diferenca === 0
																		? "Correto"
																		: item.diferenca > 0
																			? "Excesso"
																			: "Falta"}
																</Badge>
															</div>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="text-center py-8">
												<p className="text-muted-foreground">
													Nenhum item foi conferido ainda.
												</p>
											</div>
										)}
									</ScrollArea>
								</CardContent>
							</Card>
						</div>
					</>
				)}
			</div>
		</DashboardLayout>
	);
};
