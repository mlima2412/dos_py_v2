import React from "react";
import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	MapPin,
	Package,
	User,
	Calendar,
	CheckCircle,
	Clock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";
import CurrencyInput from "react-currency-input-field";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useTransferenciaEstoqueControllerFindOne } from "@/api-client";
import type { TransferenciaEstoqueResponseDto } from "@/api-client/types";

interface DialogVisualizarTransferenciaProps {
	isOpen: boolean;
	onClose: () => void;
	publicId: string;
	parceiroId: number;
}

export const DialogVisualizarTransferencia: React.FC<
	DialogVisualizarTransferenciaProps
> = ({ isOpen, onClose, publicId, parceiroId }) => {
	const { t, i18n } = useTranslation("common");
	const { formatCurrency } = useCurrencyFormatter();

	const {
		data: transferencia,
		isLoading,
		error,
	} = useTransferenciaEstoqueControllerFindOne(
		publicId,
		{
			"x-parceiro-id": parceiroId,
		},
		{
			query: {
				enabled: isOpen && !!publicId,
			},
		}
	);

	const form = useForm({
		defaultValues: {
			dataTransferencia: "",
			dataRecebimento: "",
			observacao: "",
			valorTotal: 0,
		},
	});

	// Atualizar form quando os dados chegarem
	React.useEffect(() => {
		if (transferencia) {
			console.log("Transferencia data:", transferencia);
			form.reset({
				dataTransferencia: transferencia.dataTransferencia || "",
				dataRecebimento: transferencia.dataRecebimento || "",
				observacao: transferencia.observacao || "",
				valorTotal: transferencia.valorTotal || 0,
			});
		}
	}, [transferencia, form]);

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString || dateString === "") return "-";
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				console.warn("Invalid date string:", dateString);
				return "-";
			}
			const locale = i18n.language === "es" ? es : ptBR;
			return format(date, "dd/MM/yyyy HH:mm", { locale });
		} catch (error) {
			console.error("Error formatting date:", dateString, error);
			return "-";
		}
	};

	const getStatusBadge = (transferencia: TransferenciaEstoqueResponseDto) => {
		if (transferencia.dataRecebimento) {
			return (
				<Badge
					variant="default"
					className="bg-green-100 text-green-800 border-green-200"
				>
					<CheckCircle className="h-3 w-3 mr-1" />
					{t("inventory.transfer.status.received")}
				</Badge>
			);
		}
		return (
			<Badge
				variant="secondary"
				className="bg-yellow-100 text-yellow-800 border-yellow-200"
			>
				<Clock className="h-3 w-3 mr-1" />
				{t("inventory.transfer.status.pending")}
			</Badge>
		);
	};

	if (error) {
		return (
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-4xl">
					<div className="flex items-center justify-center py-8">
						<div className="text-destructive">{t("common.loadError")}</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						{t("inventory.transfer.title")}
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">{t("common.loading")}</div>
					</div>
				) : (
					<ScrollArea className="max-h-[70vh] pr-4">
						<div className="space-y-6">
							{/* Informações Gerais */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Calendar className="h-5 w-5" />
										{t("inventory.transfer.columns.date")}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Form {...form}>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="dataTransferencia"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("inventory.transfer.columns.date")}
														</FormLabel>
														<FormControl>
															<Input value={formatDate(field.value)} disabled />
														</FormControl>
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="dataRecebimento"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("inventory.transfer.status.received")}
														</FormLabel>
														<FormControl>
															<Input
																value={
																	field.value
																		? formatDate(field.value)
																		: t("inventory.transfer.status.pending")
																}
																disabled
															/>
														</FormControl>
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="valorTotal"
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t("expenses.totalAmount")}</FormLabel>
														<FormControl>
															<CurrencyInput
																value={field.value}
																decimalsLimit={2}
																decimalSeparator=","
																groupSeparator="."
																disabled
																className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
															/>
														</FormControl>
													</FormItem>
												)}
											/>
											<FormItem>
												<FormLabel>{t("common.status")}</FormLabel>
												<FormControl>
													<div className="flex items-center h-10">
														{transferencia && getStatusBadge(transferencia)}
													</div>
												</FormControl>
											</FormItem>
										</div>
									</Form>
								</CardContent>
							</Card>

							{/* Locais de Origem e Destino */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<MapPin className="h-5 w-5" />
											{t("inventory.transfer.columns.source")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										{transferencia && (
											<div className="space-y-2">
												<div className="font-medium">
													{transferencia.localOrigem.nome}
												</div>
												<div className="text-sm text-muted-foreground">
													{transferencia.localOrigem.endereco}
												</div>
												{transferencia.localOrigem.descricao && (
													<div className="text-sm text-muted-foreground">
														{transferencia.localOrigem.descricao}
													</div>
												)}
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<MapPin className="h-5 w-5" />
											{t("inventory.transfer.columns.destination")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										{transferencia && (
											<div className="space-y-2">
												<div className="font-medium">
													{transferencia.localDestino.nome}
												</div>
												<div className="text-sm text-muted-foreground">
													{transferencia.localDestino.endereco}
												</div>
												{transferencia.localDestino.descricao && (
													<div className="text-sm text-muted-foreground">
														{transferencia.localDestino.descricao}
													</div>
												)}
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Usuários */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<User className="h-5 w-5" />
											{t("inventory.transfer.enviadoPor")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										{transferencia && (
											<div className="space-y-2">
												<div className="font-medium">
													{transferencia.enviadoPorUsuario.nome}
												</div>
												<div className="text-sm text-muted-foreground">
													{transferencia.enviadoPorUsuario.email}
												</div>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<User className="h-5 w-5" />
											{t("inventory.transfer.recebidoPor")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										{transferencia && (
											<div className="space-y-2">
												{transferencia.recebidoPorUsuario ? (
													<>
														<div className="font-medium">
															{transferencia.recebidoPorUsuario.nome}
														</div>
														<div className="text-sm text-muted-foreground">
															{transferencia.recebidoPorUsuario.email}
														</div>
													</>
												) : (
													<div className="text-sm text-muted-foreground">
														{t("inventory.transfer.status.pending")}
													</div>
												)}
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Observações */}
							{transferencia?.observacao && (
								<Card>
									<CardHeader>
										<CardTitle>{t("clients.labels.observations")}</CardTitle>
									</CardHeader>
									<CardContent>
										<Textarea
											value={transferencia.observacao}
											disabled
											className="min-h-[80px]"
										/>
									</CardContent>
								</Card>
							)}

							{/* Itens da Transferência */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Package className="h-5 w-5" />
										{t("inventory.transfer.productSkus")}
									</CardTitle>
								</CardHeader>
								<CardContent>
									{transferencia?.TransferenciaEstoqueItem &&
									transferencia.TransferenciaEstoqueItem.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>{t("products.columns.code")}</TableHead>
													<TableHead>{t("products.name")}</TableHead>
													<TableHead>{t("products.skus.color")}</TableHead>
													<TableHead>{t("products.skus.size")}</TableHead>
													<TableHead>
														{t("inventory.transfer.quantity")}
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{transferencia.TransferenciaEstoqueItem.map(
													(item, index) => (
														<TableRow key={index}>
															<TableCell className="font-mono">
																{item.sku?.produto?.id
																	.toString()
																	.padStart(3, "0")}
																-{item.sku?.id.toString().padStart(3, "0")}
															</TableCell>
															<TableCell>{item.sku?.produto?.nome}</TableCell>
															<TableCell>{item.sku?.cor || "-"}</TableCell>
															<TableCell>{item.sku?.tamanho || "-"}</TableCell>
															<TableCell className="font-medium">
																{item.qtd}
															</TableCell>
														</TableRow>
													)
												)}
											</TableBody>
										</Table>
									) : (
										<div className="text-center py-8 text-muted-foreground">
											{t("inventory.transfer.noResults")}
										</div>
									)}
								</CardContent>
							</Card>

							{/* Botão Fechar */}
							<div className="flex justify-end pt-4">
								<Button onClick={onClose} variant="outline">
									{t("common.close")}
								</Button>
							</div>
						</div>
					</ScrollArea>
				)}
			</DialogContent>
		</Dialog>
	);
};
