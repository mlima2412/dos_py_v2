import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMovimentoEstoqueControllerAjusteEstoque } from "@/api-client/hooks/useMovimentoEstoqueControllerAjusteEstoque";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

interface AdjustStockDialogProps {
	isOpen: boolean;
	onClose: () => void;
	skuId: number;
	currentStock: number;
	localId: number;
	skuInfo: {
		productName: string;
		color?: string;
		size?: string;
	};
	onSuccess?: () => void;
}

export const AdjustStockDialog: React.FC<AdjustStockDialogProps> = ({
	isOpen,
	onClose,
	skuId,
	currentStock,
	localId,
	skuInfo,
	onSuccess,
}) => {
	const { t } = useTranslation("common");
	const { user } = useAuth();
	const { success: toastSuccess, error: toastError } = useToast();
	const queryClient = useQueryClient();
	const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
	const [newStock, setNewStock] = useState<number>(currentStock);
	const [isAdjusting, setIsAdjusting] = useState(false);
	const [observation, setObservation] = useState<string>("");

	const movimentoEstoqueMutation = useMovimentoEstoqueControllerAjusteEstoque({
		mutation: {
			onSuccess: () => {
				toastSuccess(t("inventory.adjust.success"));
				// Invalidar especificamente a query de produtos por local para forçar reload
				queryClient.invalidateQueries({
					queryKey: [{ url: "/produto/local/:localId" }],
				});
				// Também invalidar todas as queries que começam com essa URL
				queryClient.invalidateQueries({
					predicate: query => {
						const queryKey = query.queryKey;
						return (
							Array.isArray(queryKey) &&
							queryKey.length > 0 &&
							typeof queryKey[0] === "object" &&
							"url" in queryKey[0] &&
							queryKey[0].url === "/produto/local/:localId"
						);
					},
				});
				onClose();
				onSuccess?.();
			},
			onError: (error: any) => {
				console.error("Erro ao ajustar estoque:", error);
				toastError(t("inventory.adjust.error"));
			},
		},
	});

	// Reset form when dialog opens/closes
	useEffect(() => {
		if (isOpen) {
			setAdjustmentAmount(0);
			setNewStock(currentStock);
			setObservation("");
		}
	}, [isOpen, currentStock]);

	// Calculate new stock when adjustment amount changes
	useEffect(() => {
		setNewStock(currentStock + adjustmentAmount);
	}, [currentStock, adjustmentAmount]);

	const handleAdjustmentChange = (value: string) => {
		const numValue = parseInt(value) || 0;
		setAdjustmentAmount(numValue);
	};

	const handleAdjust = async () => {
		if (!adjustmentAmount || adjustmentAmount === 0) {
			toastError(t("inventory.adjust.validation.amountRequired"));
			return;
		}

		if (adjustmentAmount < 0 && Math.abs(adjustmentAmount) > currentStock) {
			toastError(t("inventory.adjust.validation.insufficientStock"));
			return;
		}

		if (!user?.id) {
			toastError("Usuário não autenticado");
			return;
		}

		setIsAdjusting(true);

		try {
			const defaultObservation = `Ajuste de estoque: ${adjustmentAmount > 0 ? "incremento" : "decremento"} de ${Math.abs(adjustmentAmount)} unidades`;
			const finalObservation = observation.trim() || defaultObservation;

			await movimentoEstoqueMutation.mutateAsync({
				data: {
					skuId,
					localId,
					qtdAjuste: adjustmentAmount, // Enviar o valor real (positivo ou negativo)
					observacao: finalObservation,
				},
			});
		} catch (error) {
			console.error("Erro ao ajustar estoque:", error);
		} finally {
			setIsAdjusting(false);
		}
	};

	const handleClose = () => {
		if (!isAdjusting) {
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Layers className="h-5 w-5" />
						{t("inventory.adjust.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* SKU Info */}
					<Card>
						<CardContent className="pt-4">
							<div className="space-y-2">
								<div className="font-medium">{skuInfo.productName}</div>
								<div className="flex gap-2 text-sm text-muted-foreground">
									{skuInfo.color && <span>Cor: {skuInfo.color}</span>}
									{skuInfo.size && <span>Tamanho: {skuInfo.size}</span>}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Current and New Stock */}
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-4">
							<Label className="text-sm font-medium">
								{t("inventory.adjust.currentStock")}:
							</Label>
							<Badge variant="outline" className="text-sm">
								{currentStock}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-sm font-medium">
								{t("inventory.adjust.newStock")}:
							</Label>
							<Badge
								variant={newStock < 0 ? "destructive" : "default"}
								className="text-sm"
							>
								{newStock}
							</Badge>
						</div>
					</div>

					<div className="border-t" />

					{/* Adjustment Input */}
					<div className="space-y-2">
						<Label htmlFor="adjustment">
							{t("inventory.adjust.adjustmentAmount")}
						</Label>
						<Input
							id="adjustment"
							type="number"
							value={adjustmentAmount || ""}
							onChange={e => handleAdjustmentChange(e.target.value)}
							placeholder="Digite a quantidade de ajuste"
							className="text-center"
						/>
						<div className="text-xs text-muted-foreground text-center">
							{adjustmentAmount > 0 && (
								<span className="text-green-600">
									+{adjustmentAmount} ({t("inventory.adjust.increment")})
								</span>
							)}
							{adjustmentAmount < 0 && (
								<span className="text-red-600">
									{adjustmentAmount} ({t("inventory.adjust.decrement")})
								</span>
							)}
							{adjustmentAmount === 0 && <span>Nenhum ajuste</span>}
						</div>
					</div>

					{/* Observation Field */}
					<div className="space-y-2">
						<Label htmlFor="observation">Observação (opcional)</Label>
						<Input
							id="observation"
							type="text"
							value={observation}
							onChange={e => setObservation(e.target.value)}
							placeholder="Digite uma observação sobre o ajuste..."
							className="text-sm"
						/>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-4">
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={isAdjusting}
						>
							{t("inventory.adjust.cancel")}
						</Button>
						<Button
							onClick={handleAdjust}
							disabled={isAdjusting || adjustmentAmount === 0}
						>
							{isAdjusting ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
									{t("inventory.adjust.adjust")}
								</>
							) : (
								t("inventory.adjust.adjust")
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
