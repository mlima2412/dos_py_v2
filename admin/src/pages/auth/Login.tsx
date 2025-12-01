import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	EnvelopeIcon,
	LockClosedIcon,
	LockOpenIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { LanguageSelector } from "../../components/LanguageSelector";
import { useAuth } from "../../hooks/useAuth";
import type { AuthControllerLoginMutationRequest } from "@/api-client";

const Login: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { login, loginWithGoogle, isLoading } = useAuth();

	const [email, setEmail] = useState("mlima001@gmail.com");
	const [password, setPassword] = useState("123456");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isGoogleButtonReady, setIsGoogleButtonReady] = useState(false);
	const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
	const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
	const googleInitializedRef = useRef(false);
	const googleButtonRef = useRef<HTMLDivElement | null>(null);

	// Redirecionar para onde o usuário estava tentando ir, ou para dashboard
	const from = location.state?.from?.pathname || "/dashboard";

	const handleGoogleCredential = useCallback(
		async (credentialResponse: google.accounts.id.CredentialResponse) => {
			if (!credentialResponse.credential) {
				setError(t("login.errors.googleCredentialMissing"));
				setIsGoogleAuthenticating(false);
				return;
			}

			try {
				setError("");
				await loginWithGoogle(credentialResponse.credential);
				navigate(from, { replace: true });
			} catch (err) {
				let message: string | undefined;
				if (
					err &&
					typeof err === "object" &&
					"data" in err &&
					err.data &&
					typeof err.data === "object" &&
					err.data !== null &&
					"message" in err.data
				) {
					message = (err.data as { message?: string }).message;
				} else if (err instanceof Error) {
					message = err.message;
				}
				setError(message || t("login.errors.googleFailed"));
			} finally {
				setIsGoogleAuthenticating(false);
			}
		},
		[from, loginWithGoogle, navigate, t]
	);

	useEffect(() => {
		if (!googleClientId) {
			return;
		}

			const initializeGoogle = () => {
				if (
					googleInitializedRef.current ||
					!window.google?.accounts?.id
				) {
					return;
				}

				window.google.accounts.id.initialize({
					client_id: googleClientId,
					callback: handleGoogleCredential,
					auto_select: false,
					use_fedcm_for_prompt: true,
				});

				if (googleButtonRef.current) {
					window.google.accounts.id.renderButton(
						googleButtonRef.current,
						{
							type: "standard",
							size: "large",
							theme: "outline",
							text: "continue_with",
							shape: "rectangular",
							width: googleButtonRef.current.offsetWidth || 300,
						}
					);
					setIsGoogleButtonReady(true);
				}

				googleInitializedRef.current = true;
			};

			if (window.google?.accounts?.id) {
				initializeGoogle();
			return;
		}

		const existingScript = document.getElementById("google-identity");
		if (existingScript) {
			existingScript.addEventListener("load", initializeGoogle);
			return () => {
				existingScript.removeEventListener("load", initializeGoogle);
			};
		}

			const scriptElement = document.createElement("script");
			scriptElement.src = "https://accounts.google.com/gsi/client";
			scriptElement.async = true;
			scriptElement.defer = true;
			scriptElement.id = "google-identity";
			scriptElement.onload = initializeGoogle;
			scriptElement.onerror = () => {
				setError(t("login.errors.googleInit"));
			};
			document.head.appendChild(scriptElement);

			return () => {
				scriptElement.onload = null;
			};
		}, [googleClientId, handleGoogleCredential, t]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!email || !password) {
			setError("Por favor, preencha todos os campos");
			return;
		}

		try {
			const credentials: AuthControllerLoginMutationRequest = {
				email,
				senha: password,
			};
			await login(credentials);
			navigate(from, { replace: true });
		} catch (error: unknown) {
			setError(
				error instanceof Error
					? error.message
					: "Erro ao fazer login. Verifique suas credenciais."
			);
		}
	};

	return (
		<div className="min-h-screen grid lg:grid-cols-[70%_30%]">
			{/* Left Column - Logo */}
			<div className="hidden lg:flex items-center justify-center bg-muted p-8">
				<div className="text-center">
					<img
						className="mx-auto h-48 w-auto mb-8"
						src="/logo-menu-color.png"
						alt="Logo"
					/>
					<div className="flex justify-center">
						<LanguageSelector />
					</div>
				</div>
			</div>

			{/* Right Column - Login Form */}
			<div className="flex items-center justify-center p-8">
				<div className="w-full max-w-md space-y-6">
					{/* Mobile Logo */}
					<div className="lg:hidden text-center space-y-4">
						<img
							className="mx-auto h-16 w-auto"
							src="/logo-menu-color.png"
							alt="DOS Logo"
						/>
						<div className="flex justify-center">
							<LanguageSelector />
						</div>
					</div>

					<Card>
						<CardHeader className="space-y-1">
							<CardTitle className="text-xl font-bold">
								{t("login.title")}
							</CardTitle>
							<CardDescription className="text-sm">
								{t("login.subtitle")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Login Form */}
							<form onSubmit={handleLogin} className="space-y-4">
								<div className="space-y-2">
									<label htmlFor="email" className="text-sm font-medium">
										{t("login.email")}
									</label>
									<div className="relative">
										<EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
										<Input
											id="email"
											type="email"
											placeholder={t("login.emailPlaceholder")}
											value={email}
											onChange={e => setEmail(e.target.value)}
											className="pl-10"
											required
										/>
									</div>
								</div>

								<div className="space-y-2">
									<label htmlFor="password" className="text-sm font-medium">
										{t("login.password")}
									</label>
									<div className="relative">
										{showPassword ? (
											<LockOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 text-red-500" />
										) : (
											<LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
										)}
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder={t("login.passwordPlaceholder")}
											value={password}
											onChange={e => setPassword(e.target.value)}
											className="pl-10 pr-10"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
										>
											{showPassword ? (
												<EyeSlashIcon className="h-4 w-4" />
											) : (
												<EyeIcon className="h-4 w-4" />
											)}
										</button>
									</div>
									<div className="text-right">
										<Link
											to="/forgot-password"
											className="text-sm text-blue-600 hover:underline"
										>
											{t("login.forgotPassword")}
										</Link>
									</div>
								</div>

								{error && (
									<div className="text-red-600 text-sm text-center">
										{error}
									</div>
								)}

								<Button
									disabled={isLoading}
									onClick={handleLogin}
									variant="outline"
									className="w-full"
								>
									{isLoading ? t("common.loading") : t("login.signIn")}
								</Button>
							</form>

							{/* Divider */}
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t" />
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-2 bg-background text-muted-foreground">
										ou
									</span>
								</div>
							</div>

							<div className="space-y-2 relative">
								<div
									ref={googleButtonRef}
									className="absolute opacity-0 pointer-events-none -z-10 h-0 overflow-hidden"
									aria-hidden="true"
								/>

								<Button
									variant="outline"
									onClick={() => {
										setError("");
										if (!googleClientId) {
											setError(
												t("login.errors.googleNotConfigured")
											);
											return;
										}

										if (
											!googleInitializedRef.current ||
											!window.google?.accounts?.id
										) {
											setError(t("login.errors.googleInit"));
											return;
										}

										const googleButton =
											googleButtonRef.current?.querySelector(
												'div[role="button"]'
											);
										if (!googleButton) {
											setError(
												t("login.errors.googleInit")
											);
											return;
										}

										setIsGoogleAuthenticating(true);
										googleButton.dispatchEvent(
											new MouseEvent("click", {
												bubbles: true,
												cancelable: true,
											})
										);
									}}
									disabled={
										isLoading ||
										isGoogleAuthenticating ||
										!googleClientId ||
										!isGoogleButtonReady
									}
									className="w-full"
								>
									<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
										<path
											fill="#4285F4"
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										/>
										<path
											fill="#34A853"
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										/>
										<path
											fill="#FBBC05"
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										/>
										<path
											fill="#EA4335"
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										/>
									</svg>
									{isGoogleAuthenticating || isLoading
										? t("common.loading")
										: t("login.googleSignIn")}
								</Button>

								{!googleClientId && (
									<p className="text-xs text-center text-muted-foreground">
										{t("login.errors.googleNotConfigured")}
									</p>
								)}
								{googleClientId && !isGoogleButtonReady && (
									<p className="text-xs text-center text-muted-foreground">
										{t("common.loading")}
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export { Login };
export default Login;
