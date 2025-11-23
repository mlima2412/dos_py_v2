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
import type { DescontoTipo } from "../types";

export interface DiscountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentDiscountType?: DescontoTipo;
	currentDiscountValue?: number;
	itemPrice: number;
	onConfirm: (discountValue: number, discountType: DescontoTipo) => void;
}

export const DiscountDialog: React.FC<DiscountDialogProps> = ({
	open,
	onOpenChange,
	currentDiscountType = "VALOR",
	currentDiscountValue = 0,
	itemPrice,
	onConfirm,
}) => {
	const { t } = useTranslation("common");
	const [discountValue, setDiscountValue] = useState<string>("");
	const [discountPercentage, setDiscountPercentage] = useState<string>("");

	useEffect(() => {
		if (open) {
			// Initialize with current discount based on type
			if (currentDiscountValue > 0) {
				if (currentDiscountType === "PERCENTUAL") {
					setDiscountPercentage(currentDiscountValue.toFixed(2));
					setDiscountValue("");
				} else {
					setDiscountValue(currentDiscountValue.toFixed(2));
					setDiscountPercentage("");
				}
			} else {
				setDiscountValue("");
				setDiscountPercentage("");
			}
		}
	}, [open, currentDiscountValue, currentDiscountType]);

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
		let discountValueToSend = 0;
		let discountType: DescontoTipo = "VALOR";

		if (discountValue) {
			// Desconto em valor absoluto
			discountValueToSend = Math.max(0, parseFloat(discountValue));
			discountType = "VALOR";

			// Validate discount doesn't exceed item price
			if (discountValueToSend > itemPrice) {
				discountValueToSend = itemPrice;
			}
		} else if (discountPercentage) {
			// Desconto em percentual
			discountValueToSend = Math.max(0, parseFloat(discountPercentage));
			discountType = "PERCENTUAL";

			// Validate percentage doesn't exceed 100%
			if (discountValueToSend > 100) {
				discountValueToSend = 100;
			}
		}

		onConfirm(discountValueToSend, discountType);
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
