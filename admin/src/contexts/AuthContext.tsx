import React, { useState, useEffect, ReactNode } from "react";
import {
	AuthControllerGetProfile200,
	authControllerGetProfile,
	authControllerLogin,
} from "@/api-client";
import { LoginDto } from "@/types/auth";
import { AuthContext } from "./AuthContextDefinition";
import { AuthContextType } from "./AuthContextType";
import { useQueryClient } from "@tanstack/react-query";

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<AuthControllerGetProfile200 | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedPartnerData, setSelectedPartnerData] =
		useState<AuthControllerGetProfile200 | null>(null);
	const queryClient = useQueryClient();

	const isAuthenticated = !!user;

	// Verificar se há token salvo e carregar perfil do usuário
	useEffect(() => {
		const initializeAuth = async () => {
			const token = localStorage.getItem("accessToken");
			if (token) {
				try {
					const profile = await authControllerGetProfile();
					setUser(profile);
				} catch {
					// Token inválido, remover
					localStorage.removeItem("accessToken");
					localStorage.removeItem("refresh_token");
				}
			}
			setIsLoading(false);
		};

		initializeAuth();
	}, []);

	const login = async (credentials: LoginDto) => {
		try {
			setIsLoading(true);
			const loginResponse = await authControllerLogin(credentials);

			// Salvar token no localStorage
			if (loginResponse.accessToken) {
				localStorage.setItem("accessToken", loginResponse.accessToken);
			}

			// Carregar perfil do usuário após login
			const profile = await authControllerGetProfile();
			setUser(profile);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		try {
			// Clear tokens from localStorage
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refresh_token");

			// Invalidate all queries to clear cache
			queryClient.invalidateQueries();

			// Clear all cached data
			queryClient.clear();
		} finally {
			setUser(null);
		}
	};

	const refreshProfile = async () => {
		const profile = await authControllerGetProfile();
		setUser(profile);
	};

	const updateSelectedPartner = (
		partnerData: AuthControllerGetProfile200 | null
	) => {
		setSelectedPartnerData(partnerData);
	};

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated,
		selectedPartnerData,
		login,
		logout,
		refreshProfile,
		updateSelectedPartner,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
