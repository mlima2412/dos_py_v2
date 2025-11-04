import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { MapPin, Package, User, CheckCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useTransferenciaEstoqueControllerFindOne,
	useTransferenciaEstoqueSkuControllerFindByTransferencia,
} from "@/api-client";
import type { TransferenciaEstoqueResponseDto } from "@/api-client/types";

export const VisualizarTransferencia: React.FC = () => {
	const { t, i18n } = useTranslation("common");
	const { publicId } = useParams<{ publicId: string }>();
	const { selectedPartnerId } = usePartnerContext();
	const { formatCurrency } = useCurrencyFormatter();

	const {
		data: transferencia,
		isLoading,
		error,
	} = useTransferenciaEstoqueControllerFindOne(
		publicId || "",
		{
			"x-parceiro-id": selectedPartnerId ? Number(selectedPartnerId) : 0,
		},
		{
			query: {
				enabled: !!publicId,
			},
		}
	);

	// Buscar SKUs da transferência usando publicId
	const { data: transferenciaSkus, isLoading: isLoadingSkus } =
		useTransferenciaEstoqueSkuControllerFindByTransferencia(publicId || "", {
			query: {
				enabled: !!publicId,
			},
		});

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

	const getTotalItems = () => {
		if (!transferenciaSkus) return 0;
		return transferenciaSkus.reduce(
			(total, item) => total + item.quantidade,
			0
		);
	};

	const formatCurrencyValue = (value: number) => {
		return formatCurrency(value);
	};

	if (error) {
		return (
			
				<div className="flex items-center justify-center py-8">
					<div className="text-destructive">{t("common.loadError")}</div>
				</div>
			
		);
	}

	if (isLoading) {
		return (
			
				<div className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">{t("common.loading")}</div>
				</div>
			
		);
	}

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/inicio">
								{t("navigation.home")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/produtos">
								{t("menu.products.main")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/produtos/listar-transferencia">
								{t("menu.products.transfers")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{t("inventory.transfer.actions.view")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="space-y-6">
					{/* Informações Gerais */}
					<Card>
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
												<FormLabel>
													{t("expenses.totalAmount")} /{" "}
													{t("inventory.transfer.totalItems")}
												</FormLabel>
												<FormControl>
													<Input
														value={`${formatCurrencyValue(field.value)} (${getTotalItems()} ${t("inventory.transfer.items")})`}
														disabled
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

					{/* Itens da Transferência */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								{t("inventory.transfer.productSkus")} ({getTotalItems()}{" "}
								{t("inventory.transfer.items")})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoadingSkus ? (
								<div className="text-center py-8 text-muted-foreground">
									{t("common.loading")}
								</div>
							) : transferenciaSkus && transferenciaSkus.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("products.name")}</TableHead>
											<TableHead>{t("products.skus.color")}</TableHead>
											<TableHead>{t("products.skus.size")}</TableHead>
											<TableHead className="text-right">
												{t("inventory.transfer.quantity")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transferenciaSkus.map((item, index) => (
											<TableRow key={index}>
												<TableCell>{item.produto || "-"}</TableCell>
												<TableCell>{item.cor || "-"}</TableCell>
												<TableCell>{item.tamanho || "-"}</TableCell>
												<TableCell className="text-right font-medium">
													{item.quantidade}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									{t("inventory.transfer.noResults")}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		
	);
};
