export type ExpenseReportType = "sintetico" | "analitico";

export interface ExpenseItem {
	id: number;
	publicId: string;
	data: string;
	descricao: string;
	valor: number;
	categoria: string;
	classificacao: string;
	fornecedor?: string;
	moeda: {
		nome: string;
		isoCode: string;
		locale: string;
	};
}

export interface MonthGroup {
	year: number;
	month: number;
	monthName: string;
	expenses: ExpenseItem[];
	subtotal: number;
}

export interface YearGroup {
	year: number;
	monthGroups: MonthGroup[];
	yearSubtotal: number;
}

export interface ExpenseReportData {
	reportType: ExpenseReportType;
	year?: string;
	month?: number;
	yearGroups: YearGroup[];
	totalValue: number;
	totalExpenses: number;
	partnerCurrency: {
		locale: string;
		isoCode: string;
	};
}
