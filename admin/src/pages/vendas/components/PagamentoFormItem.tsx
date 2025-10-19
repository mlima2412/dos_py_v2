import React from "react";
import { useTranslation } from "react-i18next";
import { X, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { PagamentoFormData } from "../types";
import type {
	PagamentoTipoEnum,
	FormaPagamentoResponseDto,
} from "@/api-client/types";

interface PagamentoFormItemProps {
	index: number;
	pagamento: PagamentoFormData;
	tipoVenda: PagamentoTipoEnum | undefined;
	formasPagamento: FormaPagamentoResponseDto[];
	onUpdate: (index: number, pagamento: Partial<PagamentoFormData>) => void;
	onRemove: (index: number) => void;
	isView: boolean;
}

const DATE_FORMAT = "dd/MM/yyyy";

export const PagamentoFormItem: React.FC<PagamentoFormItemProps> = ({
	index,
	pagamento,
	tipoVenda,
	formasPagamento,
	onUpdate,
	onRemove,
	isView,
}) => {
	const { t } = useTranslation("common");

	const formaSelecionada = formasPagamento.find(
		f => f.idFormaPag === pagamento.formaPagamentoId
	);

	const handleValorChange = (value: string) => {
		if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
			const numValue = value === "" ? 0 : parseFloat(value);
			onUpdate(index, { valor: isNaN(numValue) ? 0 : numValue });
		}
	};

	const showParcelas = tipoVenda === "PARCELADO";
	const showVencimento = tipoVenda === "A_PRAZO_SEM_PARCELAS";

	return (
		<Card className="relative">
			{!isView && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-2 top-2 h-6 w-6"
					onClick={() => onRemove(index)}
				>
					<X className="h-4 w-4" />
				</Button>
			)}
			<CardHeader>
				<CardTitle className="text-sm">
					{t("salesOrders.form.labels.paymentMethod")} #{index + 1}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.paymentMethod")}</Label>
						{isView ? (
							<div className="text-sm font-medium">
								{formaSelecionada?.nome || "-"}
							</div>
						) : (
							<Select
								value={String(pagamento.formaPagamentoId || "")}
								onValueChange={value =>
									onUpdate(index, { formaPagamentoId: Number(value) })
								}
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
						)}
					</div>

					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.paymentValue")}</Label>
						{isView ? (
							<div className="text-sm font-medium">{pagamento.valor}</div>
						) : (
							<Input
								type="text"
								inputMode="decimal"
								value={pagamento.valor}
								onChange={e => handleValorChange(e.target.value)}
								className="text-right"
							/>
						)}
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id={`entrada-${index}`}
							checked={pagamento.entrada}
							onCheckedChange={checked =>
								onUpdate(index, { entrada: checked as boolean })
							}
							disabled={isView}
						/>
						<Label htmlFor={`entrada-${index}`} className="text-sm">
							{t("salesOrders.form.labels.isEntry")}
						</Label>
					</div>
				</div>

				{showParcelas && (
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("salesOrders.form.labels.installmentNumber")}</Label>
							{isView ? (
								<div className="text-sm font-medium">
									{pagamento.numeroParcelas || "-"}
								</div>
							) : (
								<Input
									type="number"
									min={1}
									value={pagamento.numeroParcelas || 1}
									onChange={e =>
										onUpdate(index, {
											numeroParcelas: Math.max(1, Number(e.target.value)),
										})
									}
								/>
							)}
						</div>

						<div className="space-y-2">
							<Label>{t("salesOrders.form.labels.firstDueDate")}</Label>
							{isView ? (
								<div className="text-sm font-medium">
									{pagamento.primeiraParcelaData
										? format(pagamento.primeiraParcelaData, DATE_FORMAT)
										: "-"}
								</div>
							) : (
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!pagamento.primeiraParcelaData &&
													"text-muted-foreground"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{pagamento.primeiraParcelaData
												? format(pagamento.primeiraParcelaData, DATE_FORMAT)
												: "Selecione a data"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={pagamento.primeiraParcelaData}
											onSelect={date =>
												onUpdate(index, { primeiraParcelaData: date })
											}
										/>
									</PopoverContent>
								</Popover>
							)}
						</div>
					</div>
				)}

				{showVencimento && (
					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.dueDate")}</Label>
						{isView ? (
							<div className="text-sm font-medium">
								{pagamento.vencimento
									? format(pagamento.vencimento, DATE_FORMAT)
									: "-"}
							</div>
						) : (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!pagamento.vencimento && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{pagamento.vencimento
											? format(pagamento.vencimento, DATE_FORMAT)
											: "Selecione a data"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={pagamento.vencimento}
										onSelect={date => onUpdate(index, { vencimento: date })}
									/>
								</PopoverContent>
							</Popover>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
