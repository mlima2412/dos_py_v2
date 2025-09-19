import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search, Play, Package } from "lucide-react";
// import { Progress } from "@/components/ui/progress"; // Componente não existe ainda
import { toast } from "react-toastify";

import { useLocaisEstoque } from "@/hooks/useEstoques";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useConferenciaEstoqueControllerCreate,
	useConferenciaItemControllerCreate,
	useConferenciaItemControllerUpdate,
	useConferenciaItemControllerFindByConferencia,
	useEstoqueSkuControllerFindByLocal,
} from "@/api-client";
import type {
	LocalEstoque,
	ConferenciaEstoque,
	EstoqueSku,
} from "@/api-client/types";
import { ConferenciaSkuListing } from "./components/ConferenciaSkuListing";

export const NovaConferencia: React.FC = () => {
	const { t } = useTranslation("common");
	// const navigate = useNavigate(); // Não usado ainda
	const { selectedPartnerId } = usePartnerContext();

	// Estados do formulário
	const [selectedLocal, setSelectedLocal] = useState<LocalEstoque | null>(null);
	const [conferenciaAtiva, setConferenciaAtiva] =
		useState<ConferenciaEstoque | null>(null);
	const [codigoProduto, setCodigoProduto] = useState("");
	const [itensConferidos, setItensConferidos] = useState<Map<number, number>>(
		new Map()
	);

	// Buscar locais de estoque do parceiro
	const { data: locaisData } = useLocaisEstoque({
		parceiroId: selectedPartnerId ? Number(selectedPartnerId) : undefined,
	});

	// Obter lista de locais
	const locais = useMemo(() => {
		return (
			locaisData?.pages.flatMap(page => page.data || []).filter(Boolean) || []
		);
	}, [locaisData]);

	// Buscar estoque do local selecionado
	const { data: estoqueLocal } = useEstoqueSkuControllerFindByLocal(
		selectedLocal?.id || 0,
		{
			query: {
				enabled: !!selectedLocal?.id,
			},
		}
	);

	// Hooks de mutação
	const createConferencia = useConferenciaEstoqueControllerCreate();
	const createItem = useConferenciaItemControllerCreate();
	const updateItem = useConferenciaItemControllerUpdate();

	// Buscar itens da conferência ativa com dados otimizados
	const { data: itensConferencia, refetch: refetchItens } =
		useConferenciaItemControllerFindByConferencia(conferenciaAtiva?.id || 0, {
			query: {
				enabled: !!conferenciaAtiva?.id,
			},
		});

	// Calcular progresso baseado na quantidade total de itens no estoque do local
	const totalItens = estoqueLocal?.length || 0;
	const itensConferidosCount = itensConferencia?.length || 0;
	const progresso =
		totalItens > 0 ? (itensConferidosCount / totalItens) * 100 : 0;

	// Função para iniciar conferência
	const handleIniciarConferencia = async () => {
		if (!selectedLocal) {
			toast.error("Selecione um local para iniciar a conferência");
			return;
		}

		try {
			const result = await createConferencia.mutateAsync({
				data: {
					localEstoqueId: selectedLocal.id,
					usuarioResponsavel: 1, // TODO: Obter do contexto do usuário logado
					status: "PENDENTE",
				},
				headers: {
					"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 1,
				},
			});

			setConferenciaAtiva(result);
			toast.success("Conferência iniciada com sucesso!");
		} catch (error) {
			console.error("Erro ao iniciar conferência:", error);
			toast.error("Erro ao iniciar conferência. Tente novamente.");
		}
	};

	// Função para processar código do produto
	const handleCodigoProduto = async () => {
		if (!codigoProduto || !conferenciaAtiva) return;

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
						conferenciaId: conferenciaAtiva.id,
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

	return (
		<DashboardLayout>
			<div className="space-y-4">
				{/* Breadcrumb */}
				<div className="flex items-center justify-between">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/inicio">
									{t("navigation.home")}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink href="/produtos/conferencia">
									{t("menu.products.conferences")}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Nova Conferência</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{/* Formulário de Configuração */}
				{!conferenciaAtiva && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								Configurar Conferência
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
								<div className="flex-1">
									<label className="text-sm font-medium mb-2 block">
										Local de Estoque
									</label>
									<Select
										value={selectedLocal?.id.toString() || ""}
										onValueChange={value => {
											const local = locais.find(l => l.id.toString() === value);
											setSelectedLocal(local || null);
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecione o local para conferência" />
										</SelectTrigger>
										<SelectContent>
											{locais.map(local => (
												<SelectItem key={local.id} value={local.id.toString()}>
													{local.nome}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<Button
									onClick={handleIniciarConferencia}
									disabled={!selectedLocal || createConferencia.isPending}
									className="md:w-auto w-full"
								>
									<Play className="mr-2 h-4 w-4" />
									{createConferencia.isPending
										? "Iniciando..."
										: "Iniciar Conferência"}
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Área de Conferência Ativa */}
				{conferenciaAtiva && (
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
									Leitura de Código
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
										Conferir
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Lista de SKUs */}
						<ConferenciaSkuListing
							localId={selectedLocal?.id || 0}
							estoqueLocal={estoqueLocal}
							itensConferidos={itensConferidos}
							itensConferencia={itensConferencia}
							isLoading={false}
							error={null}
						/>
					</>
				)}
			</div>
		</DashboardLayout>
	);
};
