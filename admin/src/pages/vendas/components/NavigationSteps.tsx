import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import type { VendaFormStep } from "../types";

interface NavigationStepsProps {
	activeStep: VendaFormStep;
	canAccessItems: boolean;
	canAccessBilling: boolean;
	canAccessReview: boolean;
	onStepChange: (step: VendaFormStep) => void;
}

export const NavigationSteps: React.FC<NavigationStepsProps> = ({
	activeStep,
	canAccessItems,
	canAccessBilling,
	canAccessReview,
	onStepChange,
}) => {
	const { t } = useTranslation("common");

	return (
		<NavigationMenu className="justify-start">
			<NavigationMenuList className="gap-2">
				<NavigationMenuItem>
					<NavigationMenuTrigger
						onClick={() => onStepChange("basic")}
						className={cn(
							"min-w-[140px] justify-between",
							activeStep === "basic" && "bg-primary text-primary-foreground"
						)}
					>
						{t("salesOrders.form.steps.basic")}
						{canAccessItems && (
							<ChevronRight className="ml-2 h-4 w-4 opacity-80" />
						)}
					</NavigationMenuTrigger>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger
						onClick={() => onStepChange("items")}
						disabled={!canAccessItems}
						className={cn(
							"min-w-[140px] justify-between",
							activeStep === "items" && "bg-primary text-primary-foreground"
						)}
					>
						{t("salesOrders.form.steps.items")}
						{canAccessBilling && (
							<ChevronRight className="ml-2 h-4 w-4 opacity-80" />
						)}
					</NavigationMenuTrigger>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger
						onClick={() => onStepChange("billing")}
						disabled={!canAccessBilling}
						className={cn(
							"min-w-[140px] justify-between",
							activeStep === "billing" && "bg-primary text-primary-foreground"
						)}
					>
						{t("salesOrders.form.steps.billing")}
						{canAccessReview && (
							<ChevronRight className="ml-2 h-4 w-4 opacity-80" />
						)}
					</NavigationMenuTrigger>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger
						onClick={() => onStepChange("review")}
						disabled={!canAccessReview}
						className={cn(
							"min-w-[140px] justify-between",
							activeStep === "review" && "bg-primary text-primary-foreground"
						)}
					>
						{t("salesOrders.form.steps.review")}
					</NavigationMenuTrigger>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
};
