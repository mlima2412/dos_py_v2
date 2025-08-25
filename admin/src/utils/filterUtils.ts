/**
 * Normaliza o valor do filtro de perfil
 * @param perfilFilter - Valor do filtro de perfil
 * @returns String vazia se for 'all' ou falsy, senão retorna o valor original
 */
export const normalizePerfilFilter = (perfilFilter: string): string => {
	return perfilFilter && perfilFilter !== "all" ? perfilFilter : "";
};

/**
 * Verifica se um filtro está ativo (não vazio e não 'all')
 * @param filter - Valor do filtro
 * @returns true se o filtro estiver ativo
 */
export const isFilterActive = (filter: string): boolean => {
	return Boolean(filter && filter !== "all");
};
