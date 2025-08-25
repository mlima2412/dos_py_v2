import React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AlertDialogWithIconProps {
	trigger: React.ReactNode;
	icon: React.ReactNode;
	title: string;
	description: string;
	cancelText: string;
	confirmText: string;
	onConfirm: () => void;
	variant?: "default" | "destructive";
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function AlertDialogWithIcon({
	trigger,
	icon,
	title,
	description,
	cancelText,
	confirmText,
	onConfirm,
	variant = "default",
	open,
	onOpenChange,
}: AlertDialogWithIconProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent className="sm:max-w-[425px]">
				<AlertDialogHeader className="flex flex-col items-center text-center">
					<div
						className={cn(
							"flex h-12 w-12 items-center justify-center rounded-full mb-4",
							variant === "destructive"
								? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
								: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
						)}
					>
						{icon}
					</div>
					<AlertDialogTitle className="text-lg font-semibold">
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm text-muted-foreground">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
					<AlertDialogCancel className="w-full sm:w-auto">
						{cancelText}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className={cn(
							"w-full sm:w-auto",
							variant === "destructive" &&
								"bg-red-600 hover:bg-red-700 focus:ring-red-600"
						)}
					>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
