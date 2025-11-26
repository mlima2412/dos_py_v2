export interface SalesMonthData {
	year: number;
	month: number;
	monthName: string;
	valorTotal: number;
	quantidade: number;
	descontoTotal: number;
	valorBrindes: number;
	quantidadeBrindes: number;
}

export interface SalesYearData {
	year: number;
	months: SalesMonthData[];
	yearTotal: number;
	yearQuantity: number;
	yearDiscount: number;
	yearBrindes: number;
	yearBrindesQty: number;
}

export interface SalesReportData {
	year?: string;
	yearGroups: SalesYearData[];
	grandTotal: number;
	grandQuantity: number;
	grandDiscount: number;
	grandBrindes: number;
	grandBrindesQty: number;
	partnerCurrency: {
		locale: string;
		isoCode: string;
	};
}
