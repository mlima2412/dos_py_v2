import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConferredItem {
	id: number;
	skuId: number;
	qtdSistema: number;
	qtdConferencia: number;
	diferenca: number;
	produto?: {
		id: number;
		nome: string;
	};
	sku?: {
		cor: string;
		tamanho: string;
	};
}

interface ConferredItemsCardProps {
	title: string;
	items: ConferredItem[];
	height?: string;
	showEmptyMessage?: boolean;
	emptyMessage?: string;
}

export const ConferredItemsCard: React.FC<ConferredItemsCardProps> = ({
	title,
	items,
	height = "400px",
	showEmptyMessage = true,
	emptyMessage,
}) => {
	const { t } = useTranslation("common");

	const getStatusBadge = (diferenca: number) => {
		if (diferenca === 0) {
			return (
				<Badge
					variant="default"
					className="bg-green-100 text-green-800"
				>
					{t("conference.details.correct")}
				</Badge>
			);
		} else if (diferenca > 0) {
			return (
				<Badge
					variant="secondary"
					className="bg-blue-100 text-blue-800"
				>
					{t("conference.details.excess")}
				</Badge>
			);
		} else {
			return (
				<Badge variant="destructive">
					{t("conference.details.shortage")}
				</Badge>
			);
		}
	};

	const getDifferenceColor = (diferenca: number) => {
		if (diferenca === 0) return "text-green-600";
		if (diferenca > 0) return "text-blue-600";
		return "text-red-600";
	};

	const formatDifference = (diferenca: number) => {
		return diferenca > 0 ? `+${diferenca}` : diferenca.toString();
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className={`h-[${height}] w-full`}>
					{items && items.length > 0 ? (
						<div className="space-y-4 pr-4">
							{items.map((item, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex items-center gap-4">
										<div>
											<p className="font-medium">
												{item.produto?.id && item.skuId
													? `${item.produto.id.toString().padStart(3, "0")}-${item.skuId.toString().padStart(3, "0")}`
													: `SKU: ${item.skuId}`}
											</p>
											<p className="text-sm font-medium">
												{item.produto?.nome || t("conference.details.productNotFound")}
											</p>
											<p className="text-sm text-muted-foreground">
												{item.sku?.cor || "N/A"} -{" "}
												{item.sku?.tamanho || "N/A"}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="text-center">
											<p className="text-sm font-medium">
												{t("conference.details.system")}
											</p>
											<p className="text-lg">{item.qtdSistema}</p>
										</div>
										<div className="text-center">
											<p className="text-sm font-medium">
												{t("conference.details.physical")}
											</p>
											<p className="text-lg">{item.qtdConferencia}</p>
										</div>
										<div className="text-center">
											<p className="text-sm font-medium">
												{t("conference.details.difference")}
											</p>
											<p className={`text-lg font-medium ${getDifferenceColor(item.diferenca)}`}>
												{formatDifference(item.diferenca)}
											</p>
										</div>
										<div className="text-center">
											<p className="text-sm font-medium">
												{t("conference.details.status")}
											</p>
											{getStatusBadge(item.diferenca)}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						showEmptyMessage && (
							<div className="text-center py-8">
								<p className="text-muted-foreground">
									{emptyMessage || t("conference.details.noItemsConferred")}
								</p>
							</div>
						)
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
};
