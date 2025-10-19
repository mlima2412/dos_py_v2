import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DiscountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentDiscount?: number;
	itemPrice: number;
	onConfirm: (discount: number) => void;
}

export const DiscountDialog: React.FC<DiscountDialogProps> = ({
	open,
	onOpenChange,
	currentDiscount = 0,
	itemPrice,
	onConfirm,
}) => {
	const { t } = useTranslation("common");
	const [discountValue, setDiscountValue] = useState<string>("");
	const [discountPercentage, setDiscountPercentage] = useState<string>("");

	useEffect(() => {
		if (open) {
			// Initialize with current discount value
			if (currentDiscount > 0) {
				setDiscountValue(currentDiscount.toFixed(2));
				setDiscountPercentage("");
			} else {
				setDiscountValue("");
				setDiscountPercentage("");
			}
		}
	}, [open, currentDiscount]);

	const handleDiscountValueChange = (value: string) => {
		setDiscountValue(value);
		if (value) {
			setDiscountPercentage(""); // Clear percentage when value is entered
		}
	};

	const handleDiscountPercentageChange = (value: string) => {
		setDiscountPercentage(value);
		if (value) {
			setDiscountValue(""); // Clear value when percentage is entered
		}
	};

	const handleConfirm = () => {
		let finalDiscount = 0;

		if (discountValue) {
			finalDiscount = parseFloat(discountValue);
		} else if (discountPercentage) {
			const percentage = parseFloat(discountPercentage);
			finalDiscount = (itemPrice * percentage) / 100;
		}

		// Validate discount doesn't exceed item price
		if (finalDiscount > itemPrice) {
			finalDiscount = itemPrice;
		}

		onConfirm(Math.max(0, finalDiscount));
		onOpenChange(false);
	};

	const handleCancel = () => {
		setDiscountValue("");
		setDiscountPercentage("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("salesOrders.form.discount.title")}</DialogTitle>
					<DialogDescription>
						{t("salesOrders.form.discount.description")}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="discount-value">
							{t("salesOrders.form.discount.valueLabel")}
						</Label>
						<Input
							id="discount-value"
							type="number"
							step="0.01"
							min="0"
							max={itemPrice}
							value={discountValue}
							onChange={e => handleDiscountValueChange(e.target.value)}
							placeholder="0.00"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="discount-percentage">
							{t("salesOrders.form.discount.percentageLabel")}
						</Label>
						<Input
							id="discount-percentage"
							type="number"
							step="0.01"
							min="0"
							max="100"
							value={discountPercentage}
							onChange={e => handleDiscountPercentageChange(e.target.value)}
							placeholder="0.00"
						/>
					</div>
					{itemPrice > 0 && (
						<div className="text-sm text-muted-foreground">
							{t("salesOrders.form.discount.itemPrice")}: {itemPrice.toFixed(2)}
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						{t("common.cancel")}
					</Button>
					<Button onClick={handleConfirm}>{t("common.confirm")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
