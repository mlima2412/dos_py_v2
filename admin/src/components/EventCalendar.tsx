import { useMemo } from "react";
import { parseISO } from "date-fns";
import {
	EventCalendar as OriginEventCalendar,
	CalendarEvent,
} from "@/components/event-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { ContasPagarParcelas } from "@/api-client/types/ContasPagarParcelas";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePartnerContext } from "@/hooks/usePartnerContext";
import { useContasPagarParcelasControllerFindAllAgenda } from "@/api-client";

interface EventCalendarProps {
	className?: string;
}

export function EventCalendar({ className }: EventCalendarProps) {
	const navigate = useNavigate();
	const { i18n } = useTranslation();
	const { selectedPartnerId } = usePartnerContext();

	// Buscar todas as parcelas
	const { data: parcelas, isLoading } =
		useContasPagarParcelasControllerFindAllAgenda(Number(selectedPartnerId));

	// Converter parcelas para eventos do calendário
	const events = useMemo(() => {
		if (!parcelas) return [];
		return parcelas
			.filter((parcela: ContasPagarParcelas) => parcela.dataVencimento)
			.map((parcela: ContasPagarParcelas): CalendarEvent => {
				// Usar apenas o despesaId
				let title = "";
				const description = parcela.contasPagar?.despesa?.descricao;
				// if (parcela.contasPagar?.despesaId) {
				// 	title = "Conta a Pagar";
				// }
				// Formatar valor usando a moeda específica da parcela
				title += `${new Intl.NumberFormat(parcela.currency?.locale || "pt-BR", {
					style: "currency",
					currency: parcela.currency?.isoCode || "BRL",
				}).format(parcela.valor)}`;

				const vencimentoDate = parseISO(parcela.dataVencimento);

				return {
					id: parcela.contasPagar?.despesa?.publicId || "",
					title,
					description,
					start: vencimentoDate,
					end: vencimentoDate,
					allDay: true,
					color: parcela.pago ? "emerald" : "rose", // Verde para pago, vermelho para pendente
					location: parcela.pago ? "Pago" : "Pendente",
				};
			});
	}, [parcelas]);

	// Handler customizado para adicionar navegação aos eventos
	const handleEventAdd = () => {
		// Não permitir adicionar eventos
	};

	const handleEventUpdate = (updatedEvent: CalendarEvent) => {
		navigate(`/despesas/visualizar/${updatedEvent.id}`);
	};

	if (isLoading) {
		return (
			<Card className={className}>
				<CardContent className='p-6'>
					<div className='flex items-center justify-center h-64'>
						<div className='text-muted-foreground'>Carregando...</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={className}>
			<OriginEventCalendar
				events={events}
				initialView='mes'
				onEventAdd={handleEventAdd}
				onEventUpdate={handleEventUpdate}
				onEventDelete={() => {}} // Não permitir deletar eventos
				selectedPartnerLocale={i18n.resolvedLanguage || i18n.language}
			/>
		</div>
	);
}

export default EventCalendar;
