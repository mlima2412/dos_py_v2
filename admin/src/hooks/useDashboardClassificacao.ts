import { usePartnerContext } from "./usePartnerContext";
import {
	useRollupClassificacaoControllerGetClassesAno,
	useRollupClassificacaoControllerGetClassesMes,
} from "@/api-client";

// Tipos para os dados de classificação - novo formato
export interface ClassificacaoItem {
	classificacaoId: number;
	nome: string;
	catId: string;
	valorCentavos: number;
	percentual: number;
}

export interface ClassificacaoData {
	totalCentavos: number;
	classificacoes: ClassificacaoItem[];
}

// Tipos para compatibilidade com o componente de gráfico
export interface ClassificacaoItemForChart {
	classificacaoId: number;
	nome: string;
	valor: number;
	percentual?: number;
	totalMes?: number;
}

/**
 * Hook para buscar dados de classificação anual
 */
export function useClassificacaoAno(year?: number) {
	const { selectedPartnerId } = usePartnerContext();
	const currentYear = year || new Date().getFullYear();

	return useRollupClassificacaoControllerGetClassesAno(
		{
			parceiroId: selectedPartnerId || "",
			yyyy: currentYear.toString(),
		},
		{
			query: {
				enabled: !!selectedPartnerId,
				staleTime: 5 * 60 * 1000, // 5 minutos
			},
		}
	);
}

/**
 * Hook para buscar dados de classificação mensal
 */
export function useClassificacaoMes(year?: number, month?: number) {
	const { selectedPartnerId } = usePartnerContext();
	const currentDate = new Date();
	const currentYear = year || currentDate.getFullYear();
	const currentMonth = month || currentDate.getMonth() + 1;

	// Formato YYYYMM
	const yyyymm = `${currentYear}${currentMonth.toString().padStart(2, "0")}`;

	return useRollupClassificacaoControllerGetClassesMes(
		{
			parceiroId: selectedPartnerId || "",
			yyyymm,
		},
		{
			query: {
				enabled: !!selectedPartnerId,
				staleTime: 5 * 60 * 1000, // 5 minutos
			},
		}
	);
}

/**
 * Hook combinado que retorna dados de classificação anual e mensal
 */
export function useClassificacaoCompleta(year?: number, month?: number) {
	const anoData = useClassificacaoAno(year);
	const mesData = useClassificacaoMes(year, month);

	return {
		ano: anoData,
		mes: mesData,
		isLoading: anoData.isLoading || mesData.isLoading,
		error: anoData.error || mesData.error,
		refetch: () => {
			anoData.refetch();
			mesData.refetch();
		},
	};
}

/**
 * Função para converter dados do novo formato para o formato do gráfico
 */
export function convertToChartFormat(
	data: ClassificacaoData | undefined
): ClassificacaoItemForChart[] {
	if (!data || !data.classificacoes || data.classificacoes.length === 0) {
		return [];
	}

	return data.classificacoes.map(item => ({
		classificacaoId: item.classificacaoId,
		nome: item.nome,
		valor: item.valorCentavos,
		percentual: item.percentual,
		totalMes: data.totalCentavos,
	}));
}

/**
 * Função utilitária para processar dados mostrando 6 classificações principais + outros
 */
export function processClassificacaoData(
	data: ClassificacaoItemForChart[],
	totalValue?: number
): ClassificacaoItemForChart[] {
	if (!data || data.length === 0) return [];

	// Se temos 6 ou menos itens, retornar todos
	if (data.length <= 6) {
		return data;
	}

	// Pegar os primeiros 6 itens
	const mainItems = data.slice(0, 6);

	// Pegar os itens restantes para agrupar em "Outros"
	const remainingItems = data.slice(6);

	// Calcular o total se não foi fornecido
	const total = totalValue || data.reduce((sum, item) => sum + item.valor, 0);

	// Calcular valor e percentual dos "Outros"
	const othersTotal = remainingItems.reduce((sum, item) => sum + item.valor, 0);
	const othersPercentual = othersTotal / total;

	const othersItem: ClassificacaoItemForChart = {
		classificacaoId: -1, // ID especial para "Outros"
		nome: "Outros",
		valor: othersTotal,
		percentual: othersPercentual,
		totalMes: total,
	};

	return [...mainItems, othersItem];
}
