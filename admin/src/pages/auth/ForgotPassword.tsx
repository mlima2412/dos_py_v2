import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { usePasswordResetControllerRequestPasswordReset } from "@/api-client";
import type { RequestPasswordResetDto } from "@/api-client";

function ForgotPassword() {
	const { t, i18n } = useTranslation();
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [error, setError] = useState("");

	// Mutation para solicitar redefinição de senha
	const requestPasswordResetMutation =
		usePasswordResetControllerRequestPasswordReset({
			mutation: {
				onSuccess: () => {
					setSent(true);
					setError("");
				},
				onError: (error: unknown) => {
					const errorMessage =
						error && typeof error === "object" && "response" in error
							? (error as { response?: { data?: { message?: string } } })
									.response?.data?.message ||
								t("forgotPassword.error.forgotPasswordError")
							: undefined;
					setError(
						errorMessage || t("forgotPassword.error.forgotPasswordError")
					);
				},
			},
		});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const requestData: RequestPasswordResetDto = {
			email,
			language: i18n?.resolvedLanguage || "pt-BR",
		};

		requestPasswordResetMutation.mutate({ data: requestData });
	};

	return (
		<div className='min-h-screen grid lg:grid-cols-[70%_30%]'>
			{/* Left Column - Logo */}
			<div className='hidden lg:flex items-center justify-center bg-muted p-8'>
				<div className='text-center'>
					<img
						className='mx-auto h-48 w-auto mb-8'
						src='/logo-central-color.png'
						alt='Logo'
					/>
					<div className='flex justify-center'>
						<LanguageSelector />
					</div>
				</div>
			</div>

			{/* Right Column - Forgot Password Form */}
			<div className='flex items-center justify-center p-8'>
				<div className='w-full max-w-md space-y-6'>
					{/* Mobile Logo */}
					<div className='lg:hidden text-center space-y-4'>
						<img
							className='mx-auto h-16 w-auto'
							src='/logo-central-color.png'
							alt='DOS Logo'
						/>
						<div className='flex justify-center'>
							<LanguageSelector />
						</div>
					</div>

					<Card className='w-full max-w-md'>
						<CardHeader className='text-center'>
							<CardTitle className='text-xl font-bold'>
								{sent
									? t("forgotPassword.emailSent")
									: t("forgotPassword.title")}
							</CardTitle>
							<CardDescription className='text-sm'>
								{sent
									? t("forgotPassword.checkEmail")
									: t("forgotPassword.subtitle")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{!sent ? (
								<form
									onSubmit={handleSubmit}
									className='space-y-4'
								>
									{error && (
										<div className='text-red-600 text-sm text-center bg-red-50 p-2 rounded'>
											{error}
										</div>
									)}

									<div className='space-y-2'>
										<label
											htmlFor='email'
											className='text-sm font-medium'
										>
											{t("forgotPassword.emailLabel")}
										</label>
										<Input
											id='email'
											type='email'
											placeholder={t("forgotPassword.emailPlaceholder")}
											value={email}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setEmail(e.target.value)
											}
											required
										/>
									</div>

									<Button
										type='submit'
										variant='outline'
										className='w-full'
										disabled={requestPasswordResetMutation.isPending}
									>
										{requestPasswordResetMutation.isPending
											? t("forgotPassword.sending")
											: t("forgotPassword.sendButton")}
									</Button>

									<div className='text-center'>
										<Link
											to='/login'
											className='text-sm text-blue-600 hover:underline'
										>
											{t("forgotPassword.backToLogin")}
										</Link>
									</div>
								</form>
							) : (
								<div className='text-center space-y-4'>
									<div className='text-green-600 text-sm'>
										✓ {t("forgotPassword.successMessage")}
									</div>
									<Button
										asChild
										variant='outline'
										className='w-full'
									>
										<Link to='/login'>{t("forgotPassword.backToLogin")}</Link>
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

export { ForgotPassword };
export default ForgotPassword;
