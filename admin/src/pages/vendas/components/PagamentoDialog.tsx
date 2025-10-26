import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CurrencyInput from "react-currency-input-field";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PagamentoFormData } from "../types";
import type {
	PagamentoTipoEnum,
	FormaPagamentoResponseDto,
} from "@/api-client/types";

interface PagamentoDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (pagamento: PagamentoFormData) => void;
	formasPagamento: FormaPagamentoResponseDto[];
	editingPayment: PagamentoFormData | null;
	locale: string;
	currencyCode: string;
	faltaAlocar: number;
	jaTemEntrada: boolean;
}

const DATE_FORMAT = "dd/MM/yyyy";

export const PagamentoDialog: React.FC<PagamentoDialogProps> = ({
	open,
	onOpenChange,
	onSave,
	formasPagamento,
	editingPayment,
	locale,
	currencyCode,
	faltaAlocar,
	jaTemEntrada,
}) => {
	const { t } = useTranslation("common");

	const [tipoPagamento, setTipoPagamento] =
		useState<PagamentoTipoEnum>("A_VISTA_IMEDIATA");
	const [formaPagamentoId, setFormaPagamentoId] = useState<number>(
		formasPagamento[0]?.idFormaPag || 0
	);
	const [valorInput, setValorInput] = useState<string>("");
	const [entrada, setEntrada] = useState<boolean>(false);
	const [valorDelivery, setValorDelivery] = useState<number | undefined>(
		undefined
	);
	const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
	const [primeiraParcelaData, setPrimeiraParcelaData] = useState<
		Date | undefined
	>(undefined);
	const [vencimento, setVencimento] = useState<Date | undefined>(undefined);

	// Resetar formulário quando o dialog abre/fecha ou quando editingPayment muda
	useEffect(() => {
		if (open) {
			if (editingPayment) {
				setTipoPagamento(editingPayment.tipo);
				setFormaPagamentoId(editingPayment.formaPagamentoId);
				setValorInput(String(editingPayment.valor));
				setEntrada(editingPayment.entrada);
				setValorDelivery(editingPayment.valorDelivery);
				setNumeroParcelas(editingPayment.numeroParcelas || 1);
				setPrimeiraParcelaData(editingPayment.primeiraParcelaData);
				setVencimento(editingPayment.vencimento);
			} else {
				// Valores padrão para novo pagamento
				setTipoPagamento("A_VISTA_IMEDIATA");
				setFormaPagamentoId(formasPagamento[0]?.idFormaPag || 0);
				setValorInput("");
				setEntrada(!jaTemEntrada); // Se já tem entrada, não marcar por padrão
				setValorDelivery(undefined);
				setNumeroParcelas(1);
				setPrimeiraParcelaData(undefined);
				setVencimento(undefined);
			}
		}
	}, [open, editingPayment, formasPagamento, jaTemEntrada]);

	const handleSave = () => {
		// Para PARCELADO, usar o valor que falta alocar
		const valor =
			tipoPagamento === "PARCELADO"
				? faltaAlocar
				: parseFloat(valorInput.replace(",", ".") || "0");

		const pagamento: PagamentoFormData = {
			tipo: tipoPagamento,
			formaPagamentoId,
			valor,
			entrada,
			valorDelivery,
		};

		// Adicionar campos condicionais baseados no tipo do pagamento
		if (tipoPagamento === "PARCELADO") {
			pagamento.numeroParcelas = numeroParcelas;
			pagamento.primeiraParcelaData = primeiraParcelaData;
		} else if (tipoPagamento === "A_PRAZO_SEM_PARCELAS") {
			pagamento.vencimento = vencimento;
		}

		onSave(pagamento);
		onOpenChange(false);
	};

	const showFormaPagamento = tipoPagamento !== "PARCELADO";
	const showValor = tipoPagamento !== "PARCELADO";
	const showParcelas = tipoPagamento === "PARCELADO";
	const showVencimento = tipoPagamento === "A_PRAZO_SEM_PARCELAS";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{editingPayment
							? t("salesOrders.form.labels.editPayment")
							: t("salesOrders.form.labels.addPayment")}
					</DialogTitle>
					<DialogDescription>
						{t("salesOrders.form.labels.paymentDialogDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Seleção do tipo de pagamento */}
					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.paymentType")}</Label>
						<Select
							value={tipoPagamento}
							onValueChange={value =>
								setTipoPagamento(value as PagamentoTipoEnum)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecione o tipo de pagamento" />
							</SelectTrigger>
							<SelectContent>
								{["A_VISTA_IMEDIATA", "A_PRAZO_SEM_PARCELAS", "PARCELADO"].map(
									tipo => (
										<SelectItem key={tipo} value={tipo}>
											{t(`salesOrders.form.paymentTypes.${tipo}`)}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						{showFormaPagamento && (
							<div className="space-y-2">
								<Label>{t("salesOrders.form.labels.paymentMethod")}</Label>
								<Select
									value={String(formaPagamentoId)}
									onValueChange={value => setFormaPagamentoId(Number(value))}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma forma" />
									</SelectTrigger>
									<SelectContent>
										{formasPagamento.map(forma => (
											<SelectItem
												key={forma.idFormaPag}
												value={String(forma.idFormaPag)}
											>
												{forma.nome}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{showValor && (
							<div className="space-y-2">
								<Label>{t("salesOrders.form.labels.paymentValue")}</Label>
								<CurrencyInput
									placeholder="0,00"
									value={valorInput}
									decimalsLimit={2}
									intlConfig={{ locale, currency: currencyCode }}
									onValueChange={value => setValorInput(value || "")}
									className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>
						)}
					</div>

					{/* Informação para PARCELADO */}
					{tipoPagamento === "PARCELADO" && (
						<div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
							O valor será automaticamente definido como o restante a alocar:{" "}
							{new Intl.NumberFormat(locale, {
								style: "currency",
								currency: currencyCode,
							}).format(faltaAlocar)}
						</div>
					)}
					{!jaTemEntrada && tipoPagamento === "A_VISTA_IMEDIATA" && (
						<div className="flex items-center space-x-2">
							<Checkbox
								id="entrada"
								checked={entrada}
								onCheckedChange={checked => setEntrada(checked as boolean)}
								disabled={jaTemEntrada && !editingPayment?.entrada}
							/>
							<Label
								htmlFor="entrada"
								className={cn(
									"text-sm",
									jaTemEntrada &&
										!editingPayment?.entrada &&
										"text-muted-foreground"
								)}
							>
								{t("salesOrders.form.labels.isEntry")}
								{jaTemEntrada &&
									!editingPayment?.entrada &&
									" (já existe uma entrada)"}
							</Label>
						</div>
					)}

					{showParcelas && (
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>{t("salesOrders.form.labels.installmentNumber")}</Label>
								<Input
									type="number"
									min={1}
									value={numeroParcelas}
									onChange={e =>
										setNumeroParcelas(Math.max(1, Number(e.target.value)))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>{t("salesOrders.form.labels.firstDueDate")}</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!primeiraParcelaData && "text-muted-foreground"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{primeiraParcelaData
												? format(primeiraParcelaData, DATE_FORMAT)
												: "Selecione a data"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={primeiraParcelaData}
											onSelect={date => setPrimeiraParcelaData(date)}
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>
					)}

					{showVencimento && (
						<div className="space-y-2">
							<Label>{t("salesOrders.form.labels.dueDate")}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!vencimento && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{vencimento
											? format(vencimento, DATE_FORMAT)
											: "Selecione a data"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={vencimento}
										onSelect={date => setVencimento(date)}
									/>
								</PopoverContent>
							</Popover>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("salesOrders.form.actions.cancel")}
					</Button>
					<Button onClick={handleSave}>
						{t("salesOrders.form.actions.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
