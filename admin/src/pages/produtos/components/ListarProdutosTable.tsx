import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Edit,
	Power,
	PowerOff,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Eye,
} from "lucide-react";
import {
	useProdutos,
	useAtivarProduto,
	useDesativarProduto,
} from "@/hooks/useProdutos";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategoriasProduto } from "@/hooks/useCategoriaProduto";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

export const ListarProdutosTable: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
	const [sortField, setSortField] = useState<"nome" | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	// Debounce para busca
	const debouncedSearch = useDebounce(search, 500);

	// Buscar produtos com scroll infinito
	const {
		data: produtosData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useProdutos({
		search: debouncedSearch,
		categoriaId:
			categoriaFilter && categoriaFilter !== "all"
				? categoriaFilter
				: undefined,
		parceiroId: Number(selectedPartnerId) || undefined,
	});

	// Buscar categorias para o filtro
	const { data: categorias } = useCategoriasProduto();

	// Flatten dos dados para a tabela
	// Função para ordenar dados
	const handleSort = (field: "nome") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	// Processar dados para exibição com ordenação
	const data = useMemo(() => {
		const allData =
			produtosData?.pages.flatMap(page => page.data || []).filter(Boolean) ||
			[];

		if (sortField === "nome") {
			return [...allData].sort((a, b) => {
				const aValue = a.nome?.toLowerCase() || "";
				const bValue = b.nome?.toLowerCase() || "";
				if (sortDirection === "asc") {
					return aValue.localeCompare(bValue);
				} else {
					return bValue.localeCompare(aValue);
				}
			});
		}

		return allData;
	}, [produtosData, sortField, sortDirection]);

	// Total de produtos
	const total = produtosData?.pages[0]?.total || 0;

	// Hooks para ativar/desativar
	const ativarProduto = useAtivarProduto();
	const desativarProduto = useDesativarProduto();

	const handleAtivarDesativar = async (produto: any) => {
		const headers = {
			"x-parceiro-id": Number(selectedPartnerId) || 0,
		};

		if (produto.ativo) {
			await desativarProduto.mutateAsync({
				publicId: produto.publicId,
				headers,
			});
		} else {
			await ativarProduto.mutateAsync({
				publicId: produto.publicId,
				headers,
			});
		}
	};

	// Função para carregar mais dados
	const handleLoadMore = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500">{t("products.messages.loadError")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Filtros */}
			<div className="flex gap-4">
				<Input
					placeholder={t("products.placeholders.search")}
					value={search}
					onChange={e => setSearch(e.target.value)}
					className="flex-1"
				/>
				<Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
					<SelectTrigger className="w-[200px]">
						<SelectValue
							placeholder={t("products.placeholders.categoryFilter")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("products.filters.allCategories")}
						</SelectItem>
						{categorias
							?.filter(categoria => categoria.id)
							.map(categoria => (
								<SelectItem key={categoria.id} value={categoria.id!.toString()}>
									{categoria.descricao || t("products.messages.noCategory")}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
			</div>

			{/* Tabela */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("products.columns.code")}</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									onClick={() => handleSort("nome")}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									{t("products.columns.name")}
									{sortField === "nome" ? (
										sortDirection === "asc" ? (
											<ArrowUp className="ml-2 h-4 w-4" />
										) : (
											<ArrowDown className="ml-2 h-4 w-4" />
										)
									) : (
										<ArrowUpDown className="ml-2 h-4 w-4" />
									)}
								</Button>
							</TableHead>
							<TableHead>{t("products.columns.category")}</TableHead>
							<TableHead>{t("products.columns.status")}</TableHead>
							<TableHead className="w-[120px]">{t("common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8">
									{t("products.noResults")}
								</TableCell>
							</TableRow>
						) : (
							data.map(produto => (
								<TableRow key={produto.id} className="group">
									<TableCell className="font-medium">{produto.id}</TableCell>
									<TableCell>{produto.nome}</TableCell>
									<TableCell>
										{produto.categoria?.descricao ||
											t("products.messages.noCategory")}
									</TableCell>
									<TableCell>
										<Badge variant={produto.ativo ? "default" : "secondary"}>
											{produto.ativo
												? t("products.active")
												: t("products.inactive")}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0"
												onClick={() =>
													navigate(`/produtos/visualizar/${produto.publicId}`)
												}
												title={t("products.actions.view")}
											>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0"
												onClick={() =>
													navigate(`/produtos/editar/${produto.publicId}`)
												}
												title={t("products.actions.edit")}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0"
												onClick={() => handleAtivarDesativar(produto)}
												disabled={
													ativarProduto.isPending || desativarProduto.isPending
												}
												title={
													produto.ativo
														? t("products.actions.deactivate")
														: t("products.actions.activate")
												}
											>
												{produto.ativo ? (
													<PowerOff className="h-4 w-4" />
												) : (
													<Power className="h-4 w-4" />
												)}
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Rodapé com informações e botão carregar mais */}
			<div className="flex justify-between items-center">
				{/* Informações de paginação */}
				<div className="text-sm text-gray-500">
					{t("common.showing")} {data.length} {t("common.of")} {total}{" "}
					{t("products.list").toLowerCase()}
				</div>

				{/* Botão carregar mais */}
				{hasNextPage && (
					<Button
						variant="outline"
						onClick={handleLoadMore}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? t("common.loading") : t("common.loadMore")}
					</Button>
				)}
			</div>
		</div>
	);
};
