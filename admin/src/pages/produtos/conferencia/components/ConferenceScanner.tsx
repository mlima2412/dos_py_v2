import React from "react";
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

export const ConferenceScanner: React.FC<ConferenceScannerProps> = ({
	codigoProduto,
	onCodigoChange,
	onConferir,
	onKeyPress,
	isLoading = false,
}) => {
	const { t } = useTranslation("common");

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
						placeholder={t("conference.details.scanCode")}
						value={codigoProduto}
						onChange={e => onCodigoChange(e.target.value)}
						onKeyPress={onKeyPress}
						className="flex-1"
						autoFocus
						disabled={isLoading}
					/>
					<Button
						onClick={onConferir}
						disabled={!codigoProduto || isLoading}
					>
						<Play className="mr-2 h-4 w-4" />
						{t("conference.details.confer")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
