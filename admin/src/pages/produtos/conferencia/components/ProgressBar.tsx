import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

interface ProgressBarProps {
	itensConferidosCount: number;
	totalItens: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
	itensConferidosCount,
	totalItens,
}) => {
	const { t } = useTranslation("common");
	
	const progresso = totalItens > 0 ? (itensConferidosCount / totalItens) * 100 : 0;

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>{t("conference.details.progress")}</span>
						<span>
							{itensConferidosCount} {t("conference.details.of")}{" "}
							{totalItens} {t("conference.details.items")}
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${progresso}%` }}
						></div>
					</div>
					<div className="text-xs text-muted-foreground">
						{progresso.toFixed(1)}% {t("conference.details.concluded")}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
