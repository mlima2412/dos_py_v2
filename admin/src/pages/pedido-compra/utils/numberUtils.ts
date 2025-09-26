/**
 * Safely parse different kinds of numeric inputs (string, number, object with value).
 * Returns NaN when the value cannot be parsed to a finite number.
 */
export const parseToNumber = (raw: unknown): number => {
	if (raw === null || raw === undefined) {
		return Number.NaN;
	}

	if (typeof raw === "number") {
		return Number.isFinite(raw) ? raw : Number.NaN;
	}

	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!trimmed) {
			return Number.NaN;
		}

		const direct = Number(trimmed);
		if (!Number.isNaN(direct)) {
			return direct;
		}

		const normalized = trimmed.replace(/\./g, "").replace(",", ".");
		const normalizedNumber = Number(normalized);
		return Number.isNaN(normalizedNumber) ? Number.NaN : normalizedNumber;
	}

	if (typeof raw === "object" && "value" in (raw as Record<string, unknown>)) {
		return parseToNumber((raw as Record<string, unknown>).value);
	}

	return Number.NaN;
};

/**
 * Returns a fallback when the parsed value is NaN.
 */
export const safeNumber = (raw: unknown, fallback = 0): number => {
	const parsed = parseToNumber(raw);
	return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Parses an optional numeric string. Useful when a payload accepts undefined for empty fields.
 */
export const optionalNumber = (raw?: string | null): number | undefined => {
	if (raw === undefined || raw === null) return undefined;
	if (raw === "") return undefined;
	const parsed = parseToNumber(raw);
	return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Transforms any supported numeric input back into a string that can be used in controlled inputs.
 */
export const numberToInputString = (raw: unknown): string => {
	const parsed = parseToNumber(raw);
	return Number.isNaN(parsed) ? "" : parsed.toString();
};
