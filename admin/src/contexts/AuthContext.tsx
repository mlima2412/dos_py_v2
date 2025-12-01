import React, { useState, useEffect, ReactNode, useCallback } from "react";
import {
	AuthControllerGetProfile200,
	AuthControllerGetUserParceiros200,
	authControllerGetProfile,
	authControllerLogin,
	authControllerLogout,
	type LoginResponseDto,
} from "@/api-client";
import { LoginDto } from "@/types/auth";
import { AuthContext } from "./AuthContextDefinition";
import { AuthContextType } from "./AuthContextType";
import { useQueryClient } from "@tanstack/react-query";
import { AUTH_EXPIRED_EVENT } from "@/lib/fetch-client";
import fetchClient from "@/lib/fetch-client";

interface AuthProviderProps {
	children: ReactNode;
}

type ParceiroItem = AuthControllerGetUserParceiros200[0];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<AuthControllerGetProfile200 | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedPartnerData, setSelectedPartnerData] =
		useState<ParceiroItem | null>(null);
	const queryClient = useQueryClient();

	const isAuthenticated = !!user;

	const performLocalLogout = useCallback(() => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refresh_token");
		queryClient.clear();
		setSelectedPartnerData(null);
		setUser(null);
	}, [queryClient]);

	// Verificar se há token salvo e carregar perfil do usuário
	useEffect(() => {
		const initializeAuth = async () => {
			const token = localStorage.getItem("accessToken");
			if (token) {
				try {
					const profile = await authControllerGetProfile();
					setUser(profile);
				} catch {
					performLocalLogout();
				}
			}
			setIsLoading(false);
		};

		initializeAuth();
	}, [performLocalLogout]);

	useEffect(() => {
		const handleAuthExpired = () => {
			performLocalLogout();
		};

		window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
		return () => {
			window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
		};
	}, [performLocalLogout]);

	useEffect(() => {
		const handleStorage = (event: StorageEvent) => {
			if (event.key === "accessToken" && !event.newValue) {
				performLocalLogout();
			}
		};

		window.addEventListener("storage", handleStorage);
		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, [performLocalLogout]);

	const persistLogin = async (loginResponse: LoginResponseDto) => {
		if (loginResponse.accessToken) {
			localStorage.setItem("accessToken", loginResponse.accessToken);
		}

		const profile = await authControllerGetProfile();
		setUser(profile);
	};

	const login = async (credentials: LoginDto) => {
		try {
			setIsLoading(true);
			const loginResponse = await authControllerLogin(credentials);
			await persistLogin(loginResponse);
		} finally {
			setIsLoading(false);
		}
	};

	const loginWithGoogle = async (idToken: string) => {
		try {
			setIsLoading(true);
			const { data } = await fetchClient<
				LoginResponseDto,
				unknown,
				{ idToken: string }
			>({
				method: "POST",
				url: "/auth/google",
				data: { idToken },
			});
			await persistLogin(data);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = useCallback(async () => {
		setIsLoading(true);
		try {
			await authControllerLogout();
		} catch (error) {
			console.error("Erro ao fazer logout:", error);
		} finally {
			performLocalLogout();
			setIsLoading(false);
		}
	}, [performLocalLogout]);

	const refreshProfile = async () => {
		const profile = await authControllerGetProfile();
		setUser(profile);
	};

	const updateSelectedPartner = (partnerData: ParceiroItem | null) => {
		setSelectedPartnerData(partnerData);
	};

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated,
		selectedPartnerData,
		login,
		loginWithGoogle,
		logout,
		refreshProfile,
		updateSelectedPartner,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
