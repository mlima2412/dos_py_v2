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
	tipoVenda: PagamentoTipoEnum | undefined;
	formasPagamento: FormaPagamentoResponseDto[];
	editingPayment: PagamentoFormData | null;
	locale: string;
	currencyCode: string;
}

const DATE_FORMAT = "dd/MM/yyyy";

export const PagamentoDialog: React.FC<PagamentoDialogProps> = ({
	open,
	onOpenChange,
	onSave,
	tipoVenda,
	formasPagamento,
	editingPayment,
	locale,
	currencyCode,
}) => {
	const { t } = useTranslation("common");

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
				setFormaPagamentoId(editingPayment.formaPagamentoId);
				setValorInput(String(editingPayment.valor));
				setEntrada(editingPayment.entrada);
				setValorDelivery(editingPayment.valorDelivery);
				setNumeroParcelas(editingPayment.numeroParcelas || 1);
				setPrimeiraParcelaData(editingPayment.primeiraParcelaData);
				setVencimento(editingPayment.vencimento);
			} else {
				// Valores padrão para novo pagamento
				setFormaPagamentoId(formasPagamento[0]?.idFormaPag || 0);
				setValorInput("");
				setEntrada(false);
				setValorDelivery(undefined);
				setNumeroParcelas(1);
				setPrimeiraParcelaData(undefined);
				setVencimento(undefined);
			}
		}
	}, [open, editingPayment, formasPagamento]);

	const handleSave = () => {
		const valor = parseFloat(valorInput.replace(",", ".") || "0");

		const pagamento: PagamentoFormData = {
			formaPagamentoId,
			valor,
			entrada,
			valorDelivery,
		};

		// Adicionar campos condicionais baseados no tipoVenda
		if (tipoVenda === "PARCELADO") {
			pagamento.numeroParcelas = numeroParcelas;
			pagamento.primeiraParcelaData = primeiraParcelaData;
		} else if (tipoVenda === "A_PRAZO_SEM_PARCELAS") {
			pagamento.vencimento = vencimento;
		}

		onSave(pagamento);
		onOpenChange(false);
	};

	const showParcelas = tipoVenda === "PARCELADO";
	const showVencimento = tipoVenda === "A_PRAZO_SEM_PARCELAS";

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
					<div className="grid gap-4 md:grid-cols-2">
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
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="entrada"
							checked={entrada}
							onCheckedChange={checked => setEntrada(checked as boolean)}
						/>
						<Label htmlFor="entrada" className="text-sm">
							{t("salesOrders.form.labels.isEntry")}
						</Label>
					</div>

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
