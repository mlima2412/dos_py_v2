import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import type {
	ProdutosPorLocalResponseDto,
	ConferenciaItemResponseDto,
	EstoqueSku,
} from "@/api-client/types";

interface ConferenciaSkuListingProps {
	localId: number;
	estoqueLocal?: EstoqueSku[];
	produtosLocal?: ProdutosPorLocalResponseDto[];
	itensConferidos: Map<number, number>;
	itensConferencia?: ConferenciaItemResponseDto[];
	isLoading: boolean;
	error: any;
}

export const ConferenciaSkuListing: React.FC<ConferenciaSkuListingProps> = ({
	estoqueLocal,
	produtosLocal,
	itensConferidos,
	itensConferencia,
	isLoading,
	error,
}) => {
	const { t } = useTranslation("common");

	// Processar dados para exibição - usar estoqueLocal como fonte principal
	const dadosParaExibicao = useMemo(() => {
		// Criar um mapa dos itens conferidos para facilitar a busca
		const itensConferidosMap = new Map<number, ConferenciaItemResponseDto>();
		if (itensConferencia) {
			itensConferencia.forEach(item => {
				itensConferidosMap.set(item.skuId, item);
			});
		}

		// Usar estoqueLocal como fonte principal (todos os produtos do estoque do local)
		if (estoqueLocal && estoqueLocal.length > 0) {
			const skus: Array<{
				skuId: number;
				produtoId: number;
				produtoNome: string;
				cor: string;
				tamanho: string;
				qtd: number;
				qtdConferida: number;
				diferenca: number;
				ajustado: boolean;
			}> = [];

			estoqueLocal.forEach(estoque => {
				const itemConferido = itensConferidosMap.get(estoque.skuId);

				skus.push({
					skuId: estoque.skuId,
					produtoId: (estoque.sku as any)?.produto?.id || 0,
					produtoNome:
						(estoque.sku as any)?.produto?.nome || "Produto não encontrado",
					cor: (estoque.sku as any)?.cor || "",
					tamanho: (estoque.sku as any)?.tamanho || "",
					qtd: estoque.qtd,
					qtdConferida: itemConferido?.qtdConferencia || 0,
					diferenca: itemConferido?.diferenca || 0,
					ajustado: itemConferido?.ajustado || false,
				});
			});

			return skus;
		}

		// Fallback para produtosLocal se estoqueLocal não estiver disponível
		if (produtosLocal && produtosLocal.length > 0) {
			const skus: Array<{
				skuId: number;
				produtoId: number;
				produtoNome: string;
				cor: string;
				tamanho: string;
				qtd: number;
				qtdConferida: number;
				diferenca: number;
				ajustado: boolean;
			}> = [];

			produtosLocal.forEach(produto => {
				produto.ProdutoSKU.forEach(sku => {
					const itemConferido = itensConferidosMap.get(sku.id);

					skus.push({
						skuId: sku.id,
						produtoId: produto.id,
						produtoNome: produto.nome,
						cor: sku.cor || "",
						tamanho: sku.tamanho || "",
						qtd: sku.estoque,
						qtdConferida: itemConferido?.qtdConferencia || 0,
						diferenca: itemConferido?.diferenca || 0,
						ajustado: itemConferido?.ajustado || false,
					});
				});
			});

			return skus;
		}

		// Fallback para itensConferencia se nenhum dos anteriores estiver disponível
		if (itensConferencia && itensConferencia.length > 0) {
			return itensConferencia.map(item => ({
				skuId: item.skuId,
				produtoId: item.produto?.id || 0,
				produtoNome: item.produto?.nome || "Produto não encontrado",
				cor: item.sku?.cor || "",
				tamanho: item.sku?.tamanho || "",
				qtd: item.qtdSistema,
				qtdConferida: item.qtdConferencia,
				diferenca: item.diferenca,
				ajustado: item.ajustado,
			}));
		}

		return [];
	}, [itensConferencia, produtosLocal, estoqueLocal]);

	const getStatusBadge = (sistemQtd: number, conferidoQtd: number) => {
		const diferenca = conferidoQtd - sistemQtd;

		if (diferenca === 0) {
			return (
				<Badge
					variant="default"
					className="bg-green-100 text-green-800 border-green-200"
				>
					Correto
				</Badge>
			);
		} else if (diferenca > 0) {
			return (
				<Badge
					variant="secondary"
					className="bg-blue-100 text-blue-800 border-blue-200"
				>
					Excesso (+{diferenca})
				</Badge>
			);
		} else {
			return <Badge variant="destructive">Falta ({diferenca})</Badge>;
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Package className="h-5 w-5" />
					Produtos em Conferência
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">{t("common.loading")}</div>
					</div>
				) : error ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-destructive">{t("common.loadError")}</div>
					</div>
				) : dadosParaExibicao.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">Nenhum item encontrado</div>
					</div>
				) : (
					<ScrollArea className="h-[450px] w-full rounded-md border">
						<div className="min-w-[800px]">
							<Table>
								<TableHeader className="sticky top-0 bg-background z-10">
									<TableRow>
										<TableHead className="h-8 py-2 bg-background text-center">
											Código / Produto
										</TableHead>
										<TableHead className="h-8 py-2 bg-background text-center">
											SKU
										</TableHead>
										<TableHead className="h-8 py-2 bg-background text-center">
											Estoque Sistema
										</TableHead>
										<TableHead className="h-8 py-2 bg-background text-center">
											Estoque Físico
										</TableHead>
										<TableHead className="h-8 py-2 bg-background text-center">
											Diferença
										</TableHead>
										<TableHead className="h-8 py-2 bg-background text-center">
											Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{dadosParaExibicao.map(item => {
										// Usar dados da conferência se disponíveis, senão usar itensConferidos
										const conferidoQtd =
											item.qtdConferida || itensConferidos.get(item.skuId) || 0;
										const diferenca =
											item.diferenca !== undefined
												? item.diferenca
												: conferidoQtd - item.qtd;

										return (
											<TableRow
												key={`${item.produtoId}-${item.skuId}`}
												className={conferidoQtd > 0 ? "bg-muted/30" : ""}
											>
												<TableCell className="text-left">
													<div>
														<p className="font-mono text-xs font-medium">
															{item.produtoId > 0
																? `${item.produtoId.toString().padStart(3, "0")}-${item.skuId.toString().padStart(3, "0")}`
																: item.skuId.toString().padStart(3, "0")}
														</p>
														<p className="text-xs font-medium">
															{item.produtoNome}
														</p>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<div className="text-sm">
														{item.cor && (
															<p className="text-xs text-muted-foreground">
																Cor: {item.cor}
															</p>
														)}
														{item.tamanho && (
															<p className="text-xs text-muted-foreground">
																Tamanho: {item.tamanho}
															</p>
														)}
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Badge variant="outline">{item.qtd}</Badge>
												</TableCell>
												<TableCell className="text-center">
													<Badge
														variant={conferidoQtd > 0 ? "default" : "secondary"}
														className={
															conferidoQtd > 0
																? "bg-blue-100 text-blue-800"
																: ""
														}
													>
														{conferidoQtd}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													{conferidoQtd > 0 ? (
														<span
															className={
																diferenca === 0
																	? "text-green-600 font-medium"
																	: diferenca > 0
																		? "text-blue-600 font-medium"
																		: "text-red-600 font-medium"
															}
														>
															{diferenca > 0 ? `+${diferenca}` : diferenca}
														</span>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</TableCell>
												<TableCell className="text-center">
													{conferidoQtd > 0 ? (
														getStatusBadge(item.qtd, conferidoQtd)
													) : (
														<Badge
															variant="outline"
															className="text-muted-foreground"
														>
															Pendente
														</Badge>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
};
