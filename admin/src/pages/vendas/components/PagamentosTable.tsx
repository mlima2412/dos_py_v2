import React from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PagamentoFormData } from "../types";
import type { FormaPagamentoResponseDto } from "@/api-client/types";

interface PagamentosTableProps {
	pagamentos: PagamentoFormData[];
	formasPagamento: FormaPagamentoResponseDto[];
	onEdit: (index: number) => void;
	onRemove: (index: number) => void;
	formatCurrency: (value: number) => string;
	isView: boolean;
}

const DATE_FORMAT = "dd/MM/yyyy";

export const PagamentosTable: React.FC<PagamentosTableProps> = ({
	pagamentos,
	formasPagamento,
	onEdit,
	onRemove,
	formatCurrency,
	isView,
}) => {
	const { t } = useTranslation("common");

	if (pagamentos.length === 0) {
		return (
			<Alert>
				<AlertDescription>
					{t("salesOrders.form.messages.noPaymentsAdded")}
				</AlertDescription>
			</Alert>
		);
	}

	const getFormaPagamentoNome = (id: number) => {
		const forma = formasPagamento.find(f => f.idFormaPag === id);
		return forma?.nome || "-";
	};

	// Verificar se algum pagamento tem parcelas ou vencimento para mostrar as colunas
	const showParcelasColumn = pagamentos.some(p => p.tipo === "PARCELADO");
	const showVencimentoColumn = pagamentos.some(
		p => p.tipo === "A_PRAZO_SEM_PARCELAS"
	);

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("salesOrders.form.labels.paymentType")}</TableHead>
						<TableHead>{t("salesOrders.form.labels.paymentMethod")}</TableHead>
						<TableHead className="text-right">
							{t("salesOrders.form.labels.paymentValue")}
						</TableHead>
						<TableHead className="text-center">
							{t("salesOrders.form.labels.entry")}
						</TableHead>
						{showParcelasColumn && (
							<>
								<TableHead className="text-center">
									{t("salesOrders.form.labels.installments")}
								</TableHead>
								<TableHead>
									{t("salesOrders.form.labels.firstDueDate")}
								</TableHead>
							</>
						)}
						{showVencimentoColumn && (
							<TableHead>{t("salesOrders.form.labels.dueDate")}</TableHead>
						)}
						{!isView && (
							<TableHead className="text-right">
								{t("salesOrders.form.labels.actions")}
							</TableHead>
						)}
					</TableRow>
				</TableHeader>
				<TableBody>
					{pagamentos.map((pagamento, index) => (
						<TableRow key={index}>
							<TableCell className="text-sm">
								{t(`salesOrders.form.paymentTypes.${pagamento.tipo}`)}
							</TableCell>
							<TableCell className="font-medium">
								{getFormaPagamentoNome(pagamento.formaPagamentoId)}
							</TableCell>
							<TableCell className="text-right">
								{formatCurrency(pagamento.valor)}
							</TableCell>
							<TableCell className="text-center">
								{pagamento.entrada ? (
									<Check className="h-4 w-4 text-green-600 inline" />
								) : (
									"-"
								)}
							</TableCell>
							{showParcelasColumn && (
								<>
									<TableCell className="text-center">
										{pagamento.tipo === "PARCELADO"
											? pagamento.numeroParcelas || "-"
											: "-"}
									</TableCell>
									<TableCell>
										{pagamento.tipo === "PARCELADO" &&
										pagamento.primeiraParcelaData
											? format(pagamento.primeiraParcelaData, DATE_FORMAT)
											: "-"}
									</TableCell>
								</>
							)}
							{showVencimentoColumn && (
								<TableCell>
									{pagamento.tipo === "A_PRAZO_SEM_PARCELAS" &&
									pagamento.vencimento
										? format(pagamento.vencimento, DATE_FORMAT)
										: "-"}
								</TableCell>
							)}
							{!isView && (
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onEdit(index)}
											className="h-8 w-8"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onRemove(index)}
											className="h-8 w-8 text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};
