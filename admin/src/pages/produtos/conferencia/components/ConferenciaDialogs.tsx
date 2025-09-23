import React from "react";
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
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ConfirmacaoDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "default" | "warning" | "success";
	isLoading?: boolean;
}

export const ConfirmacaoDialog: React.FC<ConfirmacaoDialogProps> = ({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	variant = "default",
	isLoading = false,
}) => {
	const { t } = useTranslation("common");
	const getIcon = () => {
		switch (variant) {
			case "warning":
				return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
			case "success":
				return <CheckCircle className="h-6 w-6 text-green-600" />;
			default:
				return null;
		}
	};

	const getConfirmButtonVariant = () => {
		switch (variant) {
			case "warning":
				return "destructive";
			case "success":
				return "default";
			default:
				return "default";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						{getIcon()}
						<DialogTitle>{title}</DialogTitle>
					</div>
					<DialogDescription className="text-left">
						{description}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						{cancelText || t("common.cancel")}
					</Button>
					<Button
						variant={getConfirmButtonVariant()}
						onClick={onConfirm}
						disabled={isLoading}
					>
						{isLoading ? t("conference.details.processing") : confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

interface ProdutosNaoConferidosDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	produtosNaoConferidos: Array<{
		skuId: number;
		produtoNome: string;
		qtdSistema: number;
		produtoId?: number;
		cor?: string;
		tamanho?: string;
	}>;
	isLoading?: boolean;
}

export const ProdutosNaoConferidosDialog: React.FC<
	ProdutosNaoConferidosDialogProps
> = ({
	open,
	onOpenChange,
	onConfirm,
	produtosNaoConferidos,
	isLoading = false,
}) => {
	const { t } = useTranslation("common");
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<AlertTriangle className="h-6 w-6 text-yellow-600" />
						<DialogTitle>
							{t("conference.details.unconferredProducts.title")}
						</DialogTitle>
					</div>
					<DialogDescription className="text-left">
						{t("conference.details.unconferredProducts.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[400px] overflow-y-auto">
					<div className="space-y-3">
						{produtosNaoConferidos.map((produto, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-4 border rounded-lg bg-zinc-600 hover:bg-zinc-400 transition-colors"
							>
								<div className="flex items-center gap-4">
									<div>
										<p className="font-semibold text-slate-900">
											{produto.produtoId && produto.skuId
												? `${produto.produtoId.toString().padStart(3, "0")}-${produto.skuId.toString().padStart(3, "0")}`
												: `SKU: ${produto.skuId}`}
										</p>
										<p className="text-sm font-semibold text-slate-900">
											{produto.produtoNome || "Produto não encontrado"}
										</p>
										<p className="text-sm text-slate-900 font-medium">
											{produto.cor || "N/A"} - {produto.tamanho || "N/A"}
										</p>
									</div>
								</div>
								<div className="text-center">
									<p className="text-sm font-medium">
										{t("conference.details.unconferredProducts.systemStock")}
									</p>
									<p className="text-lg font-semibold text-red-600">
										{produto.qtdSistema}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						{t("conference.details.unconferredProducts.cancel")}
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
					>
						{isLoading
							? t("conference.details.processing")
							: t("conference.details.unconferredProducts.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
