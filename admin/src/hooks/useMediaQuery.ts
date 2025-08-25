import { useState, useEffect } from "react";

/**
 * Hook personalizado para detectar media queries
 * @param query - A media query CSS (ex: '(max-width: 768px)')
 * @returns boolean indicando se a media query corresponde
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState<boolean>(false);

	useEffect(() => {
		// Verificar se estamos no browser
		if (typeof window === "undefined") {
			return;
		}

		const mediaQuery = window.matchMedia(query);

		// Definir o valor inicial
		setMatches(mediaQuery.matches);

		// Função para atualizar o estado quando a media query mudar
		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		// Adicionar listener
		mediaQuery.addEventListener("change", handleChange);

		// Cleanup
		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, [query]);

	return matches;
}

// Hooks pré-definidos para breakpoints comuns
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTablet = () =>
	useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)");
export const useIsSmallScreen = () => useMediaQuery("(max-width: 640px)");
export const useIsLargeScreen = () => useMediaQuery("(min-width: 1280px)");
