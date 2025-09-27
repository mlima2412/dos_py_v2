import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";

interface PurchaseOrderDetailsCardProps {
	title: string;
	supplierLabel: string;
	locationLabel: string;
	freightLabel: string;
	commissionLabel: string;
	observationLabel: string;
	onEdit: () => void;
	supplierName: string;
	locationName: string;
	supplierInfoFallback: string;
	formattedFreight: string;
	formattedCommission: string;
	observation?: string | null;
	editLabel: string;
	status: number;
}

const PurchaseOrderDetailsCardComponent: React.FC<
	PurchaseOrderDetailsCardProps
> = ({
	title,
	supplierLabel,
	locationLabel,
	freightLabel,
	commissionLabel,
	observationLabel,
	onEdit,
	supplierName,
	locationName,
	supplierInfoFallback,
	formattedFreight,
	formattedCommission,
	observation,
	editLabel,
	status = 1,
}) => {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">{title}</h3>
						{status === 1 && (
							<Button variant="outline" size="sm" onClick={onEdit}>
								<Edit className="mr-2 h-4 w-4" />
								{editLabel}
							</Button>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-2">
						<div>
							<span className="text-xs uppercase text-muted-foreground">
								{supplierLabel}
							</span>
							<p className="text-sm font-medium">
								{supplierName || supplierInfoFallback}
							</p>
							<p className="text-xs text-muted-foreground">{locationLabel}</p>
							<p className="text-sm text-muted-foreground">
								{locationName || supplierInfoFallback}
							</p>
						</div>
						<div>
							<Label className="text-sm font-medium text-muted-foreground">
								{freightLabel}
							</Label>
							<p className="text-sm font-medium">{formattedFreight}</p>
						</div>
						<div>
							<Label className="text-sm font-medium text-muted-foreground">
								{commissionLabel}
							</Label>
							<p className="text-sm font-medium">{formattedCommission}</p>
						</div>
					</div>

					{observation ? (
						<div>
							<Label className="text-sm font-medium text-muted-foreground">
								{observationLabel}
							</Label>
							<p className="text-sm">{observation}</p>
						</div>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
};

export const PurchaseOrderDetailsCard = React.memo(
	PurchaseOrderDetailsCardComponent
);
