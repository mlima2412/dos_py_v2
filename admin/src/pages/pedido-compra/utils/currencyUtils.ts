import { parseToNumber } from "./numberUtils";

interface CurrencyFormatterOptions {
	locale?: string | null;
	currency?: string | null;
	fallbackLocale?: string;
	fallbackCurrency?: string;
}

const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_CURRENCY = "BRL";

export const formatCurrency = (
	value: number,
	options: CurrencyFormatterOptions = {}
): string => {
	const {
		locale = DEFAULT_LOCALE,
		currency = DEFAULT_CURRENCY,
		fallbackLocale = DEFAULT_LOCALE,
		fallbackCurrency = DEFAULT_CURRENCY,
	} = options;

	const normalizedLocale = locale || fallbackLocale;
	const normalizedCurrency = currency || fallbackCurrency;

	return new Intl.NumberFormat(normalizedLocale, {
		style: "currency",
		currency: normalizedCurrency,
	}).format(value);
};

export const formatCurrencyFromString = (
	value: string,
	options: CurrencyFormatterOptions = {}
): string => {
	const numericValue = parseToNumber(value ?? "");
	const safeValue = Number.isNaN(numericValue) ? 0 : numericValue;
	return formatCurrency(safeValue, options);
};

export const formatCurrencyForPartner = (
	value: number | string,
	locale: string | null,
	currencyCode: string | null
): string => {
	const numericValue =
		typeof value === "number" ? value : parseToNumber(value ?? "");
	const safeValue = Number.isNaN(numericValue) ? 0 : numericValue;
	return formatCurrency(safeValue, {
		locale,
		currency: currencyCode,
	});
};
