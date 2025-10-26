import React from "react";
import { useTranslation } from "react-i18next";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useClientesControllerFindOne,
	useVendaControllerFindInvoiceNames,
} from "@/api-client";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import type { VendaFormMode, VendaFormValues } from "../types";

interface FaturamentoFormProps {
	mode: VendaFormMode;
	setValue: UseFormReturn<VendaFormValues>["setValue"];
	watch: UseFormReturn<VendaFormValues>["watch"];
	onNext: () => void;
	onBack: () => void;
}

export const FaturamentoForm: React.FC<FaturamentoFormProps> = ({
	mode,
	setValue,
	watch,
	onNext,
	onBack,
}) => {
	const { t } = useTranslation("common");
	const { selectedPartnerId } = usePartnerContext();

	const clienteId = watch("clienteId");
	const desejaFatura = watch("desejaFatura");
	const faturaEmNomeCliente = watch("faturaEmNomeCliente");
	const nomeFatura = watch("nomeFatura");
	const ruccnpjFatura = watch("ruccnpjFatura");
	const numeroFatura = watch("numeroFatura");

	const parceiroIdNumber = selectedPartnerId ? Number(selectedPartnerId) : null;

	// Buscar dados do cliente
	const { data: clienteData } = useClientesControllerFindOne(
		clienteId?.toString() ?? "",
		{
			query: {
				enabled: !!clienteId && !!parceiroIdNumber,
			},
			client: {
				headers: { "x-parceiro-id": parceiroIdNumber ?? 0 },
			},
		}
	);

	// Buscar nomes de fatura anteriores do cliente
	const { data: nomesAnteriores } = useVendaControllerFindInvoiceNames(
		clienteId ?? 0,
		{ "x-parceiro-id": parceiroIdNumber ?? 0 },
		{
			query: {
				enabled: !!clienteId && !!parceiroIdNumber && desejaFatura && !faturaEmNomeCliente,
			},
		}
	);

	const clienteTemRucCnpj = !!clienteData?.ruccnpj;
	const mostrarCampoRucCnpj = desejaFatura && faturaEmNomeCliente && !clienteTemRucCnpj;
	const mostrarDadosTerceiro = desejaFatura && !faturaEmNomeCliente;
	const temNomesAnteriores = nomesAnteriores && nomesAnteriores.length > 0;

	// Validação antes de avançar
	const podeAvancar = () => {
		if (!desejaFatura) return true;

		if (faturaEmNomeCliente) {
			// Se fatura em nome do cliente, precisa ter RUC/CNPJ (do cliente ou informado)
			return clienteTemRucCnpj || !!ruccnpjFatura;
		} else {
			// Se fatura em nome de terceiro, precisa de nome e RUC/CNPJ
			return !!nomeFatura && !!ruccnpjFatura;
		}
	};

	const handleNext = () => {
		if (podeAvancar()) {
			onNext();
		}
	};

	// Quando selecionar um nome anterior, preencher os campos
	const handleSelectNomeAnterior = (value: string) => {
		if (value === "novo") {
			// Limpar campos para novo nome
			setValue("nomeFatura", "");
			setValue("ruccnpjFatura", "");
		} else {
			// Buscar o nome selecionado nos dados
			const nomeEncontrado = nomesAnteriores?.find(
				(item: { nomeFatura: string; ruccnpj: string }) =>
					`${item.nomeFatura}|${item.ruccnpj}` === value
			);
			if (nomeEncontrado) {
				setValue("nomeFatura", nomeEncontrado.nomeFatura);
				setValue("ruccnpjFatura", nomeEncontrado.ruccnpj);
			}
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("salesOrders.form.sections.billing")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Cliente deseja fatura? */}
					<div className="flex items-center gap-3">
						<Label htmlFor="deseja-fatura" className="text-base font-medium">
							{t("salesOrders.form.labels.wantsInvoice")}
						</Label>
						<Switch
							id="deseja-fatura"
							checked={desejaFatura}
							onCheckedChange={checked => setValue("desejaFatura", checked)}
							disabled={mode === "view"}
						/>
					</div>

					{desejaFatura && (
						<>
							{/* Fatura em nome do cliente ou terceiro? */}
							<div className="space-y-4">
								<Label className="text-base font-medium">
									{t("salesOrders.form.labels.invoiceInNameOf")}
								</Label>
								<RadioGroup
									value={faturaEmNomeCliente ? "cliente" : "terceiro"}
									onValueChange={value =>
										setValue("faturaEmNomeCliente", value === "cliente")
									}
									disabled={mode === "view"}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="cliente" id="nome-cliente" />
										<Label htmlFor="nome-cliente" className="font-normal">
											{t("salesOrders.form.labels.customerName")}
											{clienteData && (
												<span className="ml-2 text-muted-foreground">
													({clienteData.nome} {clienteData.sobrenome})
												</span>
											)}
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="terceiro" id="nome-terceiro" />
										<Label htmlFor="nome-terceiro" className="font-normal">
											{t("salesOrders.form.labels.thirdPartyName")}
										</Label>
									</div>
								</RadioGroup>
							</div>

							{/* Se cliente não tem RUC/CNPJ, solicitar */}
							{mostrarCampoRucCnpj && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										{t("salesOrders.form.messages.customerNeedsRucCnpj")}
									</AlertDescription>
								</Alert>
							)}

							{/* Campos para fatura em nome do cliente sem RUC/CNPJ */}
							{mostrarCampoRucCnpj && (
								<div className="space-y-2">
									<Label htmlFor="ruccnpj-fatura">
										{t("salesOrders.form.labels.rucCnpj")} *
									</Label>
									<Input
										id="ruccnpj-fatura"
										value={ruccnpjFatura ?? ""}
										onChange={e => setValue("ruccnpjFatura", e.target.value)}
										placeholder="Ex: 12.345.678/0001-90"
										disabled={mode === "view"}
										required
									/>
								</div>
							)}

							{/* Campos para fatura em nome de terceiro */}
							{mostrarDadosTerceiro && (
								<>
									{/* Select com nomes anteriores, se houver */}
									{temNomesAnteriores && (
										<div className="space-y-2">
											<Label htmlFor="nomes-anteriores">
												{t("salesOrders.form.labels.previousInvoiceNames")}
											</Label>
											<Select
												onValueChange={handleSelectNomeAnterior}
												disabled={mode === "view"}
											>
												<SelectTrigger id="nomes-anteriores">
													<SelectValue
														placeholder={t(
															"salesOrders.form.placeholders.selectPreviousName"
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="novo">
														{t("salesOrders.form.labels.newInvoiceName")}
													</SelectItem>
													{nomesAnteriores.map(
														(item: { nomeFatura: string; ruccnpj: string }) => (
															<SelectItem
																key={`${item.nomeFatura}|${item.ruccnpj}`}
																value={`${item.nomeFatura}|${item.ruccnpj}`}
															>
																{item.nomeFatura} - {item.ruccnpj}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										</div>
									)}

									{/* Campos para nome e RUC/CNPJ */}
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="nome-fatura">
												{t("salesOrders.form.labels.invoiceName")} *
											</Label>
											<Input
												id="nome-fatura"
												value={nomeFatura ?? ""}
												onChange={e => setValue("nomeFatura", e.target.value)}
												placeholder={t("salesOrders.form.placeholders.fullName")}
												disabled={mode === "view"}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="ruccnpj-terceiro">
												{t("salesOrders.form.labels.rucCnpj")} *
											</Label>
											<Input
												id="ruccnpj-terceiro"
												value={ruccnpjFatura ?? ""}
												onChange={e => setValue("ruccnpjFatura", e.target.value)}
												placeholder="Ex: 12.345.678/0001-90"
												disabled={mode === "view"}
												required
											/>
										</div>
									</div>
								</>
							)}

							{/* Número da Fatura */}
							<div className="space-y-2">
								<Label htmlFor="numero-fatura">
									{t("salesOrders.form.labels.invoiceNumber")}
								</Label>
								<Input
									id="numero-fatura"
									value={numeroFatura ?? ""}
									onChange={e => setValue("numeroFatura", e.target.value)}
									placeholder="Ex: 001.002-3"
									disabled={mode === "view"}
								/>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Botões de navegação */}
			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					{t("salesOrders.form.actions.back")}
				</Button>
				<Button onClick={handleNext} disabled={!podeAvancar()}>
					{t("salesOrders.form.actions.next")}
				</Button>
			</div>
		</div>
	);
};
