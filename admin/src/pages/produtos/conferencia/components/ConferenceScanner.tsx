import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play } from "lucide-react";

interface ConferenceScannerProps {
	codigoProduto: string;
	onCodigoChange: (codigo: string) => void;
	onConferir: () => void;
	onKeyPress: (e: React.KeyboardEvent) => void;
	isLoading?: boolean;
}

export interface ConferenceScannerRef {
	focus: () => void;
}

export const ConferenceScanner = forwardRef<
	ConferenceScannerRef,
	ConferenceScannerProps
>(
	(
		{
			codigoProduto,
			onCodigoChange,
			onConferir,
			onKeyPress,
			isLoading = false,
		},
		ref
	) => {
		const { t } = useTranslation("common");
		const inputRef = useRef<HTMLInputElement>(null);

		useImperativeHandle(ref, () => ({
			focus: () => {
				// Usar um delay maior para garantir que o input esteja disponível
				setTimeout(() => {
					if (inputRef.current) {
						inputRef.current.focus();
						// Selecionar todo o texto se houver
						inputRef.current.select();
					}
				}, 300);
			},
		}));

		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Search className="h-5 w-5" />
						{t("conference.details.continueConference")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2">
						<Input
							ref={inputRef}
							id="codigoProduto"
							placeholder={t("conference.details.scanCode")}
							value={codigoProduto}
							onChange={e => onCodigoChange(e.target.value)}
							onKeyPress={onKeyPress}
							className="flex-1"
							autoFocus
							disabled={isLoading}
							autoComplete="off"
						/>
						<Button onClick={onConferir} disabled={!codigoProduto || isLoading}>
							<Play className="mr-2 h-4 w-4" />
							{t("conference.details.confer")}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}
);

ConferenceScanner.displayName = "ConferenceScanner";
