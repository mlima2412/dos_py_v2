import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
import { LanguageSelector } from "../../components/LanguageSelector";
import {
	usePasswordResetControllerResetPassword,
	usePasswordResetControllerValidateToken,
} from "@/api-client";
import type { ResetPasswordDto } from "@/api-client";

function ResetPassword() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");

	// Validar token ao carregar a página
	const {
		data: tokenValidation,
		isLoading: validatingToken,
		error: tokenError,
	} = usePasswordResetControllerValidateToken(
		{ token: token || "" },
		{
			query: {
				enabled: !!token,
				retry: false,
			},
		}
	);

	// Mutation para redefinir senha
	const resetPasswordMutation = usePasswordResetControllerResetPassword({
		mutation: {
			onSuccess: () => {
				setSuccess(true);
				setError("");
			},
			onError: (error: unknown) => {
				const errorMessage =
					error && typeof error === "object" && "response" in error
						? (error as { response?: { data?: { message?: string } } }).response
								?.data?.message
						: undefined;
				setError(errorMessage || t("resetPassword.invalidToken"));
			},
		},
	});

	useEffect(() => {
		if (!token) {
			navigate("/login");
		}
	}, [token, navigate]);

	useEffect(() => {
		if (tokenError) {
			setError(t("resetPassword.invalidToken"));
		}
	}, [tokenError, t]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validações
		if (newPassword.length < 6) {
			setError(t("resetPassword.passwordTooShort"));
			return;
		}

		if (newPassword !== confirmPassword) {
			setError(t("resetPassword.passwordMismatch"));
			return;
		}

		if (!token) {
			setError(t("resetPassword.invalidToken"));
			return;
		}

		const resetData: ResetPasswordDto = {
			token,
			newPassword,
		};

		resetPasswordMutation.mutate({ data: resetData });
	};

	if (validatingToken) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p>{t("common.loading")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen grid lg:grid-cols-[70%_30%]">
			{/* Left Column - Logo */}
			<div className="hidden lg:flex items-center justify-center bg-muted p-8">
				<div className="text-center">
					<img
						className="mx-auto h-48 w-auto mb-8"
						src="/logo-central-color.png"
						alt="Logo"
					/>
					<div className="flex justify-center">
						<LanguageSelector />
					</div>
				</div>
			</div>

			{/* Right Column - Reset Password Form */}
			<div className="flex items-center justify-center p-8">
				<div className="w-full max-w-md space-y-6">
					{/* Mobile Logo */}
					<div className="lg:hidden text-center space-y-4">
						<img
							className="mx-auto h-16 w-auto"
							src="/logo-central-color.png"
							alt="DOS Logo"
						/>
						<div className="flex justify-center">
							<LanguageSelector />
						</div>
					</div>

					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<CardTitle className="text-xl font-bold">
								{success
									? t("resetPassword.success")
									: t("resetPassword.title")}
							</CardTitle>
							<CardDescription className="text-sm">
								{success
									? t("resetPassword.successMessage")
									: t("resetPassword.subtitle")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{!success ? (
								<form onSubmit={handleSubmit} className="space-y-4">
									{error && (
										<div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
											{error}
										</div>
									)}

									<div className="space-y-2">
										<label
											htmlFor="newPassword"
											className="text-sm font-medium"
										>
											{t("resetPassword.newPasswordLabel")}
										</label>
										<Input
											id="newPassword"
											type="password"
											placeholder={t("resetPassword.newPasswordPlaceholder")}
											value={newPassword}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setNewPassword(e.target.value)
											}
											required
											minLength={6}
										/>
									</div>

									<div className="space-y-2">
										<label
											htmlFor="confirmPassword"
											className="text-sm font-medium"
										>
											{t("resetPassword.confirmPasswordLabel")}
										</label>
										<Input
											id="confirmPassword"
											type="password"
											placeholder={t(
												"resetPassword.confirmPasswordPlaceholder"
											)}
											value={confirmPassword}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setConfirmPassword(e.target.value)
											}
											required
											minLength={6}
										/>
									</div>

									<Button
										type="submit"
										variant="outline"
										className="w-full"
										disabled={
											resetPasswordMutation.isPending || !tokenValidation
										}
									>
										{resetPasswordMutation.isPending
											? t("resetPassword.resetting")
											: t("resetPassword.resetButton")}
									</Button>

									<div className="text-center">
										<Link
											to="/login"
											className="text-sm text-blue-600 hover:underline"
										>
											{t("resetPassword.backToLogin")}
										</Link>
									</div>
								</form>
							) : (
								<div className="text-center space-y-4">
									<div className="text-green-600 text-sm">
										✓ {t("resetPassword.successMessage")}
									</div>
									<Button asChild variant="outline" className="w-full">
										<Link to="/login">{t("resetPassword.backToLogin")}</Link>
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export { ResetPassword };
export default ResetPassword;
