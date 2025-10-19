import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { PagamentoFormItem } from "./PagamentoFormItem";
import type { PagamentoFormData } from "../types";
import type {
	PagamentoTipoEnum,
	FormaPagamentoResponseDto,
} from "@/api-client/types";

interface GestorPagamentosProps {
	tipoVenda: PagamentoTipoEnum | undefined;
	pagamentos: PagamentoFormData[];
	formasPagamento: FormaPagamentoResponseDto[];
	totalVenda: number;
	formatCurrency: (value: number) => string;
	onTipoVendaChange: (tipo: PagamentoTipoEnum) => void;
	onAddPagamento: () => void;
	onUpdatePagamento: (
		index: number,
		pagamento: Partial<PagamentoFormData>
	) => void;
	onRemovePagamento: (index: number) => void;
	isView: boolean;
}

export const GestorPagamentos: React.FC<GestorPagamentosProps> = ({
	tipoVenda,
	pagamentos,
	formasPagamento,
	totalVenda,
	formatCurrency,
	onTipoVendaChange,
	onAddPagamento,
	onUpdatePagamento,
	onRemovePagamento,
	isView,
}) => {
	const { t } = useTranslation("common");

	const totalAlocado = pagamentos.reduce((sum, pag) => sum + pag.valor, 0);
	const faltaAlocar = totalVenda - totalAlocado;
	const totalmenteAlocado = Math.abs(faltaAlocar) < 0.01;

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>{t("salesOrders.form.labels.paymentType")}</Label>
				{isView ? (
					<div className="text-sm font-medium">
						{tipoVenda ? t(`salesOrders.form.paymentTypes.${tipoVenda}`) : "-"}
					</div>
				) : (
					<Select
						value={tipoVenda || ""}
						onValueChange={value =>
							onTipoVendaChange(value as PagamentoTipoEnum)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecione o tipo de pagamento" />
						</SelectTrigger>
						<SelectContent>
							{[
								"A_VISTA_IMEDIATA",
								"A_PRAZO_SEM_PARCELAS",
								"PARCELADO",
								"PARCELADO_FLEXIVEL",
							].map(tipo => (
								<SelectItem key={tipo} value={tipo}>
									{t(`salesOrders.form.paymentTypes.${tipo}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			{tipoVenda && (
				<>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label>{t("salesOrders.form.labels.payments")}</Label>
							{!isView && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={onAddPagamento}
								>
									<Plus className="mr-2 h-4 w-4" />
									{t("salesOrders.form.labels.addPayment")}
								</Button>
							)}
						</div>

						{pagamentos.length === 0 ? (
							<Alert>
								<AlertDescription>
									Adicione ao menos uma forma de pagamento
								</AlertDescription>
							</Alert>
						) : (
							<div className="space-y-3">
								{pagamentos.map((pag, idx) => (
									<PagamentoFormItem
										key={idx}
										index={idx}
										pagamento={pag}
										tipoVenda={tipoVenda}
										formasPagamento={formasPagamento}
										onUpdate={onUpdatePagamento}
										onRemove={onRemovePagamento}
										isView={isView}
									/>
								))}
							</div>
						)}
					</div>

					<div className="space-y-2 rounded-md border p-4">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">
								{t("salesOrders.form.labels.total")}:
							</span>
							<span className="font-semibold">
								{formatCurrency(totalVenda)}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span>{t("salesOrders.form.labels.totalAllocated")}:</span>
							<span
								className={cn(totalAlocado > totalVenda && "text-destructive")}
							>
								{formatCurrency(totalAlocado)}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span>{t("salesOrders.form.labels.remaining")}:</span>
							<span
								className={cn(
									faltaAlocar > 0 && "text-orange-600",
									faltaAlocar < 0 && "text-destructive",
									totalmenteAlocado && "text-green-600 font-semibold"
								)}
							>
								{formatCurrency(Math.abs(faltaAlocar))}
								{totalmenteAlocado && " ✓"}
							</span>
						</div>
						{!totalmenteAlocado && pagamentos.length > 0 && (
							<Alert variant={faltaAlocar < 0 ? "destructive" : "default"}>
								<AlertDescription className="text-xs">
									{faltaAlocar > 0
										? "Ainda falta alocar valor nas formas de pagamento"
										: "Valor alocado excede o total da venda"}
								</AlertDescription>
							</Alert>
						)}
					</div>
				</>
			)}
		</div>
	);
};
