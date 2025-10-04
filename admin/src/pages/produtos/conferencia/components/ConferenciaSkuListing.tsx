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

// Tipos auxiliares para evitar uso de 'any'
interface SkuWithProduto {
	produto?: {
		id: number;
		nome: string;
	};
	cor?: string;
	tamanho?: string;
}

interface ConferenciaSkuListingProps {
	localId: number;
	estoqueLocal?: EstoqueSku[];
	produtosLocal?: ProdutosPorLocalResponseDto[];
	itensConferidos: Map<number, number>;
	itensConferencia?: ConferenciaItemResponseDto[];
	isLoading: boolean;
	error: Error | null;
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
				const skuWithProduto = estoque.sku as SkuWithProduto;

				skus.push({
					skuId: estoque.skuId,
					produtoId: skuWithProduto?.produto?.id || 0,
					produtoNome:
						skuWithProduto?.produto?.nome || "Produto não encontrado",
					cor: skuWithProduto?.cor || "",
					tamanho: skuWithProduto?.tamanho || "",
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
					className="bg-green-100 text-green-800 border-green-200 text-xs"
				>
					Correto
				</Badge>
			);
		} else if (diferenca > 0) {
			return (
				<Badge
					variant="secondary"
					className="bg-blue-100 text-blue-800 border-blue-200 text-xs"
				>
					Excesso (+{diferenca})
				</Badge>
			);
		} else {
			return (
				<Badge variant="destructive" className="text-xs">
					Falta ({diferenca})
				</Badge>
			);
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
					<ScrollArea className="h-[450px] w-full rounded-md border overflow-auto">
						<div className="min-w-[600px]">
							<Table className="table-fixed">
								<TableHeader className="sticky top-0 bg-background z-10">
									<TableRow>
										<TableHead className="h-8 py-1 px-2 bg-background text-left w-[50px]">
											Produto
										</TableHead>
										<TableHead className="h-8 py-1 px-2 bg-background text-center w-[30px]">
											Sistema
										</TableHead>
										<TableHead className="h-8 py-1 px-2 bg-background text-center w-[25px]">
											Físico
										</TableHead>
										<TableHead className="h-8 py-1 px-2 bg-background text-center w-[25px]">
											Dif
										</TableHead>
										<TableHead className="h-8 py-1 px-2 bg-background text-center w-[50px]">
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
												<TableCell className="text-left py-1 px-1 w-[140px]">
													<div className="truncate">
														<p className="font-mono text-xs font-medium">
															{item.produtoId > 0
																? `${item.produtoId.toString().padStart(3, "0")}-${item.skuId.toString().padStart(3, "0")}`
																: item.skuId.toString().padStart(3, "0")}
														</p>
														<p
															className="text-xs font-medium truncate"
															title={item.produtoNome}
														>
															{item.produtoNome}
														</p>
														<p className="text-xs text-muted-foreground truncate">
															{item.cor} - {item.tamanho}
														</p>
													</div>
												</TableCell>

												<TableCell className="text-center py-1 px-1 w-[80px]">
													<Badge variant="outline" className="text-xs px-1">
														{item.qtd}
													</Badge>
												</TableCell>
												<TableCell className="text-center py-1 px-1 w-[80px]">
													<Badge
														variant={conferidoQtd > 0 ? "default" : "secondary"}
														className={`text-xs px-1 ${
															conferidoQtd > 0
																? "bg-blue-100 text-blue-800"
																: ""
														}`}
													>
														{conferidoQtd}
													</Badge>
												</TableCell>
												<TableCell className="text-center py-1 px-1 w-[70px]">
													{conferidoQtd > 0 ? (
														<span
															className={`text-xs font-medium ${
																diferenca === 0
																	? "text-green-600"
																	: diferenca > 0
																		? "text-blue-600"
																		: "text-red-600"
															}`}
														>
															{diferenca > 0 ? `+${diferenca}` : diferenca}
														</span>
													) : (
														<span className="text-muted-foreground text-xs">
															-
														</span>
													)}
												</TableCell>
												<TableCell className="text-center py-1 px-1 w-[80px]">
													{conferidoQtd > 0 ? (
														getStatusBadge(item.qtd, conferidoQtd)
													) : (
														<Badge
															variant="outline"
															className="text-muted-foreground text-xs px-1"
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
