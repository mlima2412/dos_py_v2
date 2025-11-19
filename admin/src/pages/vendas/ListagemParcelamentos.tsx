import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useParcelamentoControllerFindAllByParceiro } from "@/api-client";
import { Button } from "@/components/ui/button";

export const ListagemParcelamentos: React.FC = () => {
	const { t } = useTranslation("common");
	const { selectedPartnerId, selectedPartnerLocale, selectedPartnerIsoCode } =
		usePartnerContext();
	const navigate = useNavigate();

	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const [situacaoFilter, setSituacaoFilter] = useState<string>("all");

	const parceiroId = selectedPartnerId ? Number(selectedPartnerId) : null;

	// Buscar parcelamentos
	const { data: parcelamentosData, isLoading } =
		useParcelamentoControllerFindAllByParceiro(
			{ "x-parceiro-id": parceiroId ?? 0 },
			{
				query: {
					enabled: !!parceiroId,
				},
			}
		);

	// Filtrar parcelamentos por termo de busca (cliente) e situação
	const filteredParcelamentos = useMemo(() => {
		if (!parcelamentosData || !Array.isArray(parcelamentosData)) return [];

		let parcelamentos = [...parcelamentosData];

		// Filtrar por termo de busca (cliente)
		if (debouncedSearchTerm) {
			const term = debouncedSearchTerm.toLowerCase();
			parcelamentos = parcelamentos.filter(parcelamento => {
				const nomeCliente = (parcelamento.clienteNome || "")
					.toLowerCase()
					.trim();
				return nomeCliente.includes(term);
			});
		}

		// Filtrar por situação
		if (situacaoFilter !== "all") {
			parcelamentos = parcelamentos.filter(parcelamento => {
				if (situacaoFilter === "open") {
					return parcelamento.situacao !== 2;
				} else if (situacaoFilter === "completed") {
					return parcelamento.situacao === 2;
				}
				return true;
			});
		}

		return parcelamentos;
	}, [parcelamentosData, debouncedSearchTerm, situacaoFilter]);

	// Formatação de data
	const formatDate = useCallback(
		(dateString: Date | string | null) => {
			if (!dateString) return "-";
			const date = new Date(dateString);
			return selectedPartnerLocale
				? date.toLocaleDateString(selectedPartnerLocale)
				: date.toLocaleDateString();
		},
		[selectedPartnerLocale]
	);

	// Formatação de moeda
	const formatCurrency = useCallback(
		(value: number | undefined) => {
			if (value === undefined || value === null) return "-";

			return new Intl.NumberFormat(selectedPartnerLocale || "pt-BR", {
				style: "currency",
				currency: selectedPartnerIsoCode || "BRL",
			}).format(value);
		},
		[selectedPartnerLocale, selectedPartnerIsoCode]
	);

	// Handlers
	const handleSearchChange = useCallback((value: string) => {
		setSearchTerm(value);
	}, []);

	const handleSituacaoChange = useCallback((value: string) => {
		setSituacaoFilter(value);
	}, []);

	const handleViewParcelamento = useCallback(
		(parcelamentoId: number) => {
			navigate(`/pedidoVendas/parcelamentos/visualizar/${parcelamentoId}`);
		},
		[navigate]
	);

	if (!selectedPartnerId) {
		return (
			<div className="text-center">
				<p className="text-muted-foreground">
					{t("common.noPartnerSelected")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<div className="flex justify-between items-center">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/inicio">
								{t("salesOrders.breadcrumb.home")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{t("menu.installments")}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>

			{/* Campo de Busca e Filtros */}
			<div className="flex gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("installments.searchByClient")}
							value={searchTerm}
							onChange={e => handleSearchChange(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				<Select value={situacaoFilter} onValueChange={handleSituacaoChange}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder={t("installments.selectStatus")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("installments.statusFilter.all")}</SelectItem>
						<SelectItem value="open">{t("installments.statusFilter.open")}</SelectItem>
						<SelectItem value="completed">{t("installments.statusFilter.completed")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tabela */}
			<Card>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">{t("common.loading")}</p>
						</div>
					) : filteredParcelamentos.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								{t("installments.noResults")}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[100px]">
											{t("installments.columns.saleId")}
										</TableHead>
										<TableHead>{t("installments.columns.client")}</TableHead>
										<TableHead>{t("installments.columns.saleDate")}</TableHead>
										<TableHead>{t("installments.columns.totalValue")}</TableHead>
										<TableHead>{t("installments.columns.paidValue")}</TableHead>
										<TableHead>{t("installments.columns.status")}</TableHead>
										<TableHead className="text-right w-[60px]"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredParcelamentos.map(parcelamento => (
										<TableRow key={parcelamento.id} className="group">
											<TableCell className="font-medium">
												#{parcelamento.vendaId}
											</TableCell>
											<TableCell>
												{parcelamento.clienteNome || "-"}
											</TableCell>
											<TableCell>
												{formatDate(parcelamento.dataVenda)}
											</TableCell>
											<TableCell>
												{formatCurrency(parcelamento.valorTotal)}
											</TableCell>
											<TableCell>
												{formatCurrency(parcelamento.valorPago)}
											</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														parcelamento.situacao === 2
															? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
															: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
													}`}
												>
													{parcelamento.situacaoDescricao}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleViewParcelamento(parcelamento.id)
													}
													title={t("installments.actions.view")}
													className="opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<Eye className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
