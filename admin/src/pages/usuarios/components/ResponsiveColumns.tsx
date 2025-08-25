import { useMemo } from "react";
import { createColumns } from "./columns";
import { useActivateUser, useDeactivateUser } from "@/hooks/useUserMutations";
import { useToast } from "@/hooks/useToast";

/**
 * Hook para gerenciar colunas responsivas
 * Em telas pequenas, oculta colunas menos importantes
 */
export const useResponsiveColumns = (
	t: (key: string) => string,
	isMobile: boolean = false
) => {
	const activateUser = useActivateUser();
	const deactivateUser = useDeactivateUser();
	const toast = useToast();

	return useMemo(() => {
		const allColumns = createColumns(t, activateUser, deactivateUser, toast);

		if (!isMobile) {
			return allColumns;
		}

		// Em dispositivos móveis, mostra apenas as colunas essenciais
		return allColumns.filter((_, index) => {
			// Usar o índice para identificar as colunas essenciais
			// 0: nome, 1: email, 2: telefone, 3: perfil, 4: ativo, 5: actions
			const essentialIndexes = [0, 1, 3, 4, 5];
			return essentialIndexes.includes(index);
		});
	}, [t, isMobile, activateUser, deactivateUser, toast]);
};

/**
 * Hook simples para detectar dispositivos móveis
 * Baseado na largura da tela
 */
export const useIsMobile = () => {
	// Em um projeto real, você poderia usar uma biblioteca como react-use
	// ou implementar um hook mais robusto com useEffect e window.matchMedia
	if (typeof window === "undefined") return false;

	return window.innerWidth < 768; // Tailwind md breakpoint
};
