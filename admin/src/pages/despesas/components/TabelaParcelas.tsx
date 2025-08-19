import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

import {
	useContasPagarParcelasControllerFindByContasPagar,
	useContasPagarParcelasControllerUpdate,
	type ContasPagarParcelas,
} from "@/api-client";
import { useToast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

interface TabelaParcelasProps {
	contasPagarId: number;
	currency?: {
		isoCode: string;
		locale: string;
		precision: number;
	};
}

export function TabelaParcelas({
	contasPagarId,
	currency,
}: TabelaParcelasProps) {
	const [loadingParcela, setLoadingParcela] = useState<string | null>(null);
	const { t } = useTranslation();
	const toast = useToast();
	const queryClient = useQueryClient();

	const { data: parcelasData = [], isLoading } =
		useContasPagarParcelasControllerFindByContasPagar(contasPagarId, {
			query: { enabled: Boolean(contasPagarId) },
		});

	// Ordenar parcelas por data de vencimento (ascendente - próxima a pagar primeiro)
	const parcelas = React.useMemo(() => {
		return [...parcelasData].sort((a, b) => {
			const dateA = new Date(a.dataVencimento).getTime();
			const dateB = new Date(b.dataVencimento).getTime();
			return dateA - dateB;
		});
	}, [parcelasData]);

	const updateMutation = useContasPagarParcelasControllerUpdate();

	const handleMarkParcelaAsPaid = async (parcela: ContasPagarParcelas) => {
		try {
			setLoadingParcela(parcela.publicId);
			await updateMutation.mutateAsync({
				publicId: parcela.publicId,
				data: {
					pago: true,
					dataPagamento: new Date().toISOString(),
				},
			});

			toast.success("Parcela marcada como paga com sucesso!");
			// Invalidar queries específicas para atualizar a tabela e listas relacionadas
			queryClient.invalidateQueries({
				queryKey: [
					"useContasPagarParcelasControllerFindByContasPagar",
					contasPagarId,
				],
			});
			// Invalidar query de despesas para atualizar status na listagem
			queryClient.invalidateQueries({
				queryKey: ["despesas"],
			});
			// Invalidar query de contas a pagar
			queryClient.invalidateQueries({
				queryKey: ["contas-pagar"],
			});
		} catch (error) {
			console.error("Erro ao marcar parcela como paga:", error);
			toast.error("Erro ao marcar parcela como paga");
		} finally {
			setLoadingParcela(null);
		}
	};

	const formatCurrency = (value: number) => {
		if (currency) {
			return new Intl.NumberFormat(currency.locale, {
				style: "currency",
				currency: currency.isoCode,
				minimumFractionDigits: currency.precision,
				maximumFractionDigits: currency.precision,
			}).format(value);
		}

		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const formatDate = (date: string | Date) => {
		return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("expenses.installments")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex items-center justify-center h-32'>
						<Spinner size='lg' />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!parcelas.length) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("expenses.installments")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground text-center py-8'>
						{t("expenses.noInstallmentsFound")}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("expenses.installments")}</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='w-[100px]'>
								{t("expenses.installmentNumber")}
							</TableHead>
							<TableHead>{t("expenses.dueDate")}</TableHead>
							<TableHead>{t("expenses.amount")}</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className='w-[100px]'>{t("common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{parcelas.map((parcela: ContasPagarParcelas, index: number) => (
							<TableRow key={parcela.publicId}>
								<TableCell className='font-medium'>{index + 1}</TableCell>
								<TableCell>{formatDate(parcela.dataVencimento)}</TableCell>
								<TableCell>{formatCurrency(parcela.valor)}</TableCell>
								<TableCell>
									<Badge variant={parcela.pago ? "default" : "secondary"}>
										{parcela.pago ? t("expenses.paid") : t("expenses.pending")}
									</Badge>
								</TableCell>
								<TableCell>
									{!parcela.pago && (
										<Button
											variant='ghost'
											size='sm'
											onClick={() => handleMarkParcelaAsPaid(parcela)}
											disabled={loadingParcela === parcela.publicId}
											className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'
											title='Marcar como paga'
										>
											{loadingParcela === parcela.publicId ? (
												<Spinner size='sm' />
											) : (
												<Check className='h-4 w-4' />
											)}
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
