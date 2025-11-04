import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "react-toastify";
import { Play } from "lucide-react";

import { useLocaisEstoque } from "@/hooks/useEstoques";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useConferenciaEstoqueControllerCreate,
	useConferenciaEstoqueControllerFindOne,
	useConferenciaItemControllerCreate,
	useConferenciaItemControllerUpdate,
	useConferenciaItemControllerFindByConferencia,
	useEstoqueSkuControllerFindByLocal,
	useConferenciaEstoqueControllerUpdate,
	useMovimentoEstoqueControllerProcessarAjustesConferenciaLote,
} from "@/api-client";
import type { LocalEstoque } from "@/api-client/types";

// Componentes internos
import { ConferenceHeader } from "./components/ConferenceHeader";
import {
	ConferredItemsCard,
	type ConferredItemsCardRef,
} from "./components/ConferredItemsCard";
import {
	ConferenceScanner,
	type ConferenceScannerRef,
} from "./components/ConferenceScanner";
import { ProgressBar } from "./components/ProgressBar";
import { ConferenciaSkuListing } from "./components/ConferenciaSkuListing";
import {
	ConfirmacaoDialog,
	ProdutosNaoConferidosDialog,
} from "./components/ConferenciaDialogs";

export const ConferenciaPage: React.FC = () => {
	const { t } = useTranslation("common");
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartnerContext();

	// Estados principais
	const [selectedLocal, setSelectedLocal] = useState<LocalEstoque | null>(null);
	const [codigoProduto, setCodigoProduto] = useState("");
	const [itensConferidos, setItensConferidos] = useState<Map<number, number>>(
		new Map()
	);

	// Refs para os componentes
	const conferenceScannerRef = useRef<ConferenceScannerRef>(null);
	const conferredItemsCardRef = useRef<ConferredItemsCardRef>(null);

	// Estado para controlar quando focar o input
	const [shouldFocusInput, setShouldFocusInput] = useState(false);

	// Estados para dialogs
	const [showProdutosNaoConferidosDialog, setShowProdutosNaoConferidosDialog] =
		useState(false);
	const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
	const [produtosNaoConferidos, setProdutosNaoConferidos] = useState<
		Array<{
			skuId: number;
			produtoNome: string;
			qtdSistema: number;
		}>
	>([]);

	// Determinar se é modo de criação ou visualização
	const isCreating = !id;
	const isViewing = !!id;

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

	// Buscar dados da conferência (apenas se estiver visualizando)
	const {
		data: conferencia,
		isLoading: isLoadingConferencia,
		error: conferenciaError,
		refetch: refetchConferencia,
	} = useConferenciaEstoqueControllerFindOne(
		id || "",
		{
			"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 1,
		},
		{
			query: {
				enabled: isViewing,
			},
		}
	);

	// Buscar estoque do local
	const localId = isCreating ? selectedLocal?.id : conferencia?.localEstoqueId;
	const { data: estoqueLocal } = useEstoqueSkuControllerFindByLocal(
		localId || 0,
		{
			query: {
				enabled: !!localId,
			},
		}
	);

	// Buscar itens da conferência
	const { data: itensConferencia, refetch: refetchItens } =
		useConferenciaItemControllerFindByConferencia(conferencia?.id || 0, {
			query: {
				enabled: !!conferencia?.id,
			},
		});

	// Hooks de mutação
	const createConferencia = useConferenciaEstoqueControllerCreate();
	const createItem = useConferenciaItemControllerCreate();
	const updateItem = useConferenciaItemControllerUpdate();
	const updateConferencia = useConferenciaEstoqueControllerUpdate();
	const processarAjustes =
		useMovimentoEstoqueControllerProcessarAjustesConferenciaLote();

	// Effect para focar o input quando necessário
	useEffect(() => {
		if (shouldFocusInput) {
			const timer = setTimeout(() => {
				conferenceScannerRef.current?.focus();
				setShouldFocusInput(false);
			}, 200); // Aumentar o delay para garantir que tudo esteja pronto

			return () => clearTimeout(timer);
		}
	}, [shouldFocusInput]);

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

	// Calcular progresso
	const totalItens = estoqueLocal?.length || 0;
	const itensConferidosCount = itensConferencia?.length || 0;

	// Função para iniciar conferência
	const handleIniciarConferencia = async () => {
		if (!selectedLocal) {
			toast.error(t("conference.details.locationRequired"));
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

			// Redirecionar para a página de visualização da conferência criada
			navigate(`/produtos/conferencia/visualizar/${result.publicId}`);
		} catch (error) {
			console.error("Erro ao iniciar conferência:", error);
			toast.error(t("conference.details.conferenceError"));
		}
	};

	// Função para processar código do produto
	const handleCodigoProduto = async () => {
		if (!codigoProduto || !conferencia) return;

		// Extrair SKU do código (formato: XXX-YYY)
		const codeParts = codigoProduto.split("-");
		if (codeParts.length !== 2) {
			toast.error(t("conference.details.invalidCodeFormat"));
			return;
		}

		const skuId = parseInt(codeParts[1]);
		if (isNaN(skuId)) {
			toast.error(t("conference.details.invalidSku"));
			return;
		}

		// Verificar se o SKU existe no estoque do local
		const skuNoEstoque = estoqueLocal?.find(item => item.skuId === skuId);
		if (!skuNoEstoque) {
			toast.error(t("conference.details.skuNotFound"));
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
			toast.success(
				t("conference.details.productConferred", { quantity: novoContador })
			);

			// Recarregar lista de itens conferidos
			refetchItens();

			// Sinalizar para focar o input após o próximo render
			setShouldFocusInput(true);

			// Scroll para o item adicionado
			setTimeout(() => {
				conferredItemsCardRef.current?.scrollToItem(skuId);
			}, 600);

			// Fallback: tentar focar diretamente também
			setTimeout(() => {
				conferenceScannerRef.current?.focus();
			}, 500);
		} catch (error) {
			console.error("Erro ao registrar item:", error);
			toast.error(t("conference.details.registerItemError"));
		}
	};

	// Função para processar Enter no campo de código
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleCodigoProduto();
		}
	};

	// Função para verificar produtos não conferidos (apenas com estoque > 0)
	const verificarProdutosNaoConferidos = () => {
		if (!estoqueLocal || !itensConferencia) return [];

		const skusConferidos = new Set(itensConferencia.map(item => item.skuId));
		const produtosNaoConferidos = estoqueLocal
			.filter(estoque => !skusConferidos.has(estoque.skuId) && estoque.qtd > 0)
			.map(estoque => ({
				skuId: estoque.skuId,
				produtoNome:
					(estoque.sku as { produto?: { nome?: string } })?.produto?.nome ||
					t("conference.details.productNotFound"),
				qtdSistema: estoque.qtd,
				produtoId: (estoque.sku as { produto?: { id?: number } })?.produto?.id,
				cor: (estoque.sku as { cor?: string })?.cor,
				tamanho: (estoque.sku as { tamanho?: string })?.tamanho,
			}));

		return produtosNaoConferidos;
	};

	// Função para registrar automaticamente produtos não conferidos
	const registrarProdutosEstoqueZero = async () => {
		if (!conferencia || !estoqueLocal || !itensConferencia) return;

		const skusConferidos = new Set(itensConferencia.map(item => item.skuId));

		// Filtrar produtos não conferidos (todos os que não foram conferidos, independente do estoque)
		const produtosNaoConferidos = estoqueLocal.filter(
			estoque => !skusConferidos.has(estoque.skuId)
		);

		// Registrar cada produto não conferido como conferido com qtdConferencia = 0
		for (const estoque of produtosNaoConferidos) {
			try {
				await createItem.mutateAsync({
					data: {
						conferenciaId: conferencia.id,
						skuId: estoque.skuId,
						qtdSistema: estoque.qtd, // Manter a quantidade real do sistema
						qtdConferencia: 0, // Sempre registrar como zero na conferência
					},
				});
			} catch (error) {
				console.error("Erro ao registrar produto não conferido:", error);
			}
		}

		// Recarregar lista de itens conferidos
		refetchItens();
	};

	// Função para finalizar conferência
	const handleFinalizarConferencia = async () => {
		if (!conferencia) return;

		// Verificar produtos não conferidos (apenas os que têm estoque > 0)
		const produtosNaoConferidos = verificarProdutosNaoConferidos();

		if (produtosNaoConferidos.length > 0) {
			setProdutosNaoConferidos(produtosNaoConferidos);
			setShowProdutosNaoConferidosDialog(true);
			return;
		}

		await executarConclusaoConferencia();
	};

	// Função para executar a conclusão da conferência
	const executarConclusaoConferencia = async () => {
		if (!conferencia) return;

		try {
			// Registrar produtos não conferidos com estoque zero APENAS após confirmação
			await registrarProdutosEstoqueZero();

			await updateConferencia.mutateAsync({
				publicId: conferencia.publicId,
				headers: {
					"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 1,
				},
				data: {
					status: "CONCLUIDA",
				},
			});

			// Recarregar dados da conferência para atualizar o status
			refetchConferencia();

			toast.success(t("conference.details.conferenceCompleted"));
			setShowProdutosNaoConferidosDialog(false);
		} catch (error) {
			console.error("Erro ao concluir conferência:", error);
			toast.error(t("conference.details.conferenceError"));
		}
	};

	// Função para processar ajustes em lote
	const handleProcessarAjustes = async () => {
		if (!conferencia || !itensConferencia) return;

		// Filtrar apenas itens que realmente precisam de ajuste (diferença != 0)
		const itensParaAjuste = itensConferencia
			.filter(item => item.diferenca !== 0)
			.map(item => ({
				skuId: item.skuId,
				localId: conferencia.localEstoqueId,
				diferenca: item.diferenca,
			}));

		try {
			// Processar ajustes se houver itens para ajustar
			if (itensParaAjuste.length > 0) {
				const resultado = await processarAjustes.mutateAsync({
					data: {
						itens: itensParaAjuste,
					},
				});

				const processedCount = resultado?.processados ?? 0;
				toast.success(
					`${t("conference.details.adjustmentsProcessed")} ${processedCount} ${t(
						"conference.details.itemsAdjusted"
					)}.`
				);
			} else {
				toast.info(t("conference.details.noAdjustmentsNeeded"));
			}

			// SEMPRE finalizar a conferência, independente de ter ajustes ou não
			await updateConferencia.mutateAsync({
				publicId: conferencia.publicId,
				headers: {
					"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 1,
				},
				data: {
					status: "FINALIZADA",
					dataFim: new Date().toISOString(),
				},
			});

			// Recarregar dados da conferência para atualizar o status
			refetchConferencia();

			toast.success(t("conference.details.conferenceFinalized"));
			setShowFinalizarDialog(false);
		} catch (error) {
			console.error("Erro ao processar ajustes:", error);
			toast.error(t("conference.details.adjustmentsError"));
		}
	};

	const handleBack = () => {
		navigate("/produtos/conferencia");
	};

	// Loading state
	if (isViewing && isLoadingConferencia) {
		return (
			
				<div className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">{t("common.loading")}</div>
				</div>
			
		);
	}

	// Error state
	if (isViewing && (conferenciaError || !conferencia)) {
		return (
			
				<div className="flex items-center justify-center py-8">
					<div className="text-destructive">
						{conferenciaError
							? t("common.loadError")
							: t("conference.details.conferenceError")}
					</div>
				</div>
			
		);
	}

	return (
		
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
								<BreadcrumbPage>
									{isCreating
										? t("conference.details.newConference")
										: t("conference.details.viewConference")}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{/* Header da Conferência */}
				<ConferenceHeader
					isEditing={isCreating}
					conferencia={conferencia}
					selectedLocal={selectedLocal}
					locais={locais}
					onLocalChange={setSelectedLocal}
					onCreateConference={handleIniciarConferencia}
					onBack={isViewing ? handleBack : undefined}
					isCreating={createConferencia.isPending}
					// isUpdating removido pois não existe na interface ConferenceHeaderProps
				/>

				{/* Área de Conferência Ativa */}
				{conferencia && (
					<>
						{/* Botão para Iniciar Conferência PENDENTE */}
						{conferencia.status === "PENDENTE" && (
							<Card>
								<CardContent className="pt-6">
									<div className="flex justify-center">
										<Button
											onClick={async () => {
												try {
													await updateConferencia.mutateAsync({
														publicId: conferencia.publicId,
														headers: {
															"x-parceiro-id": selectedPartnerId
																? Number(selectedPartnerId)
																: 1,
														},
														data: {
															status: "EM_ANDAMENTO",
														},
													});
													refetchConferencia();
													toast.success(
														t("conference.details.conferenceStarted")
													);
												} catch (error) {
													console.error("Erro ao iniciar conferência:", error);
													toast.error(t("conference.details.conferenceError"));
												}
											}}
											disabled={updateConferencia.isPending}
											size="lg"
										>
											<Play className="mr-2 h-4 w-4" />
											{updateConferencia.isPending
												? t("conference.details.startingConference")
												: t("conference.details.startConference")}
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
						{/* Barra de Progresso */}
						{conferencia.status === "EM_ANDAMENTO" && (
							<ProgressBar
								itensConferidosCount={itensConferidosCount}
								totalItens={totalItens}
							/>
						)}
						{/* Scanner de Código - apenas durante conferência */}
						{conferencia.status === "EM_ANDAMENTO" && (
							<ConferenceScanner
								ref={conferenceScannerRef}
								codigoProduto={codigoProduto}
								onCodigoChange={setCodigoProduto}
								onConferir={handleCodigoProduto}
								onKeyPress={handleKeyPress}
								isLoading={createItem.isPending || updateItem.isPending}
							/>
						)}
						{/* Cards lado a lado - apenas durante conferência */}
						{conferencia.status === "EM_ANDAMENTO" && (
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
								<ConferredItemsCard
									ref={conferredItemsCardRef}
									title={t("conference.details.conferredItems")}
									items={(itensConferencia || []).map(item => ({
										id: item.id,
										skuId: item.skuId,
										qtdSistema: item.qtdSistema,
										qtdConferencia: item.qtdConferencia,
										diferenca: item.diferenca,
										produto: item.produto,
										sku: {
											cor: item.sku?.cor || "",
											tamanho: item.sku?.tamanho || "",
										},
									}))}
									height="400px"
								/>
							</div>
						)}
						{conferencia.status === "EM_ANDAMENTO" &&
							itensConferencia &&
							itensConferencia.length > 0 && (
								<Card>
									<CardContent className="pt-6">
										<div className="flex justify-end gap-4">
											<Button
												variant="outline"
												onClick={handleFinalizarConferencia}
												disabled={updateConferencia.isPending}
											>
												{updateConferencia.isPending
													? t("conference.details.completingConference")
													: t("conference.details.completeConference")}
											</Button>
										</div>
									</CardContent>
								</Card>
							)}
						{conferencia.status === "CONCLUIDA" && (
							<>
								{/* Card de Itens Conferidos em tela cheia */}
								<ConferredItemsCard
									ref={conferredItemsCardRef}
									title={t("conference.details.conferredItems")}
									items={(itensConferencia || []).map(item => ({
										id: item.id,
										skuId: item.skuId,
										qtdSistema: item.qtdSistema,
										qtdConferencia: item.qtdConferencia,
										diferenca: item.diferenca,
										produto: item.produto,
										sku: {
											cor: item.sku?.cor || "",
											tamanho: item.sku?.tamanho || "",
										},
									}))}
									height="500px"
								/>

								{/* Botão para Finalizar */}
								<Card>
									<CardContent className="pt-6">
										<div className="flex justify-end gap-4">
											<Button
												onClick={() => setShowFinalizarDialog(true)}
												disabled={processarAjustes.isPending}
											>
												{processarAjustes.isPending
													? t("conference.details.processing")
													: t("conference.details.finalize")}
											</Button>
										</div>
									</CardContent>
								</Card>
							</>
						)}
						{/* Área para Conferência Finalizada - apenas visualização dos itens */}
						{conferencia.status === "FINALIZADA" && (
							<ConferredItemsCard
								ref={conferredItemsCardRef}
								title={t("conference.details.conferredItems")}
								items={(itensConferencia || []).map(item => ({
									id: item.id,
									skuId: item.skuId,
									qtdSistema: item.qtdSistema,
									qtdConferencia: item.qtdConferencia,
									diferenca: item.diferenca,
									produto: item.produto,
									sku: {
										cor: item.sku?.cor || "",
										tamanho: item.sku?.tamanho || "",
									},
								}))}
								height="500px"
							/>
						)}
					</>
				)}

				{/* Dialogs */}
				<ProdutosNaoConferidosDialog
					open={showProdutosNaoConferidosDialog}
					onOpenChange={setShowProdutosNaoConferidosDialog}
					onConfirm={executarConclusaoConferencia}
					produtosNaoConferidos={produtosNaoConferidos}
					isLoading={updateConferencia.isPending}
				/>

				<ConfirmacaoDialog
					open={showFinalizarDialog}
					onOpenChange={setShowFinalizarDialog}
					onConfirm={handleProcessarAjustes}
					title={t("conference.details.finalizeDialog.title")}
					description={t("conference.details.finalizeDialog.description", {
						location: conferencia?.localNome || "N/A",
					})}
					confirmText={t("conference.details.finalizeDialog.confirm")}
					cancelText={t("conference.details.finalizeDialog.cancel")}
					variant="warning"
					isLoading={processarAjustes.isPending}
				/>
			</div>
		
	);
};
