import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface PurchaseOrderValuesCardProps {
	originalLabel: string;
	totalLabel: string;
	formattedOriginal: string;
	formattedTotal: string;
}

const PurchaseOrderValuesCardComponent: React.FC<PurchaseOrderValuesCardProps> = ({
	originalLabel,
	totalLabel,
	formattedOriginal,
	formattedTotal,
}) => {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground">
								{originalLabel}
							</Label>
							<div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
								<span className="text-xl font-bold text-primary">
									{formattedOriginal}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground">
								{totalLabel}
							</Label>
							<div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
								<span className="text-xl font-bold text-primary">
									{formattedTotal}
								</span>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export const PurchaseOrderValuesCard = React.memo(PurchaseOrderValuesCardComponent);
