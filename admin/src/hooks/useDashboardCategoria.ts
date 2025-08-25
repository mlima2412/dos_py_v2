import { usePartnerContext } from "@/hooks/usePartnerContext";
import {
	useRollupClassificacaoControllerGetCategoriaAno,
	useRollupClassificacaoControllerGetCategoriaMes,
} from "@/api-client";

// Interfaces para os dados de categoria
export interface CategoriaItem {
	catId: number;
	nome: string;
	valorCentavos: number;
	percentual: number;
}

export interface CategoriaData {
	totalCentavos: number;
	categorias: CategoriaItem[];
}

// Interface para dados processados do gráfico
export interface CategoriaChartData {
	name: string;
	value: number;
	percentual: number;
}

// Interface compatível com CategoryPieChart
export interface CategoryItemForChart {
	nome: string;
	valor: number;
}

// Hook para buscar dados de categoria anual
export function useCategoriaAno(year: number) {
	const { selectedPartnerId } = usePartnerContext();

	return useRollupClassificacaoControllerGetCategoriaAno(
		{
			parceiroId: selectedPartnerId || "",
			yyyy: year.toString(),
		},
		{
			query: {
				enabled: !!selectedPartnerId,
			},
		}
	);
}

// Hook para buscar dados de categoria mensal
export function useCategoriaMes(year: number, month: number) {
	const { selectedPartnerId } = usePartnerContext();
	const yyyymm = `${year}${month.toString().padStart(2, "0")}`;

	return useRollupClassificacaoControllerGetCategoriaMes(
		{
			parceiroId: selectedPartnerId || "",
			yyyymm,
		},
		{
			query: {
				enabled: !!selectedPartnerId,
			},
		}
	);
}

// Hook combinado para buscar dados de categoria completos
export function useCategoriaCompleta(year: number) {
	const currentMonth = new Date().getMonth() + 1;
	const ano = useCategoriaAno(year);
	const mes = useCategoriaMes(year, currentMonth);

	return {
		ano,
		mes,
	};
}

// Função para converter dados de categoria para formato do gráfico
export function convertCategoriaToChartFormat(
	data: CategoriaData | undefined
): CategoriaChartData[] {
	if (!data || !data.categorias) {
		return [];
	}

	return data.categorias.map(categoria => ({
		name: categoria.nome,
		value: categoria.valorCentavos, // Converter centavos para reais
		percentual: categoria.percentual,
	}));
}

// Função para converter dados para o formato do CategoryPieChart
export function convertCategoriaForPieChart(
	data: unknown
): CategoryItemForChart[] {
	if (!data) {
		return [];
	}

	// Verificar se é o formato do endpoint ANO (array direto)
	if (Array.isArray(data)) {
		return data.map((categoria: CategoriaItem) => ({
			nome: categoria.nome || "Sem nome",
			valor: categoria.valorCentavos ? categoria.valorCentavos : 0,
		}));
	}

	// Verificar se é o formato do endpoint MES (objeto com categorias)
	if (typeof data === "object" && data !== null && "categorias" in data) {
		const mesData = data as CategoriaData;
		if (mesData.categorias && Array.isArray(mesData.categorias)) {
			return mesData.categorias.map((categoria: CategoriaItem) => ({
				nome: categoria.nome || "Sem nome",
				valor: categoria.valorCentavos ? categoria.valorCentavos : 0,
			}));
		}
	}

	return [];
}
