import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";
import { Sketch } from "@uiw/react-color";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ColorPickerDialogProps {
	sku: {
		publicId: string;
		codCor?: string | number;
		cor?: string;
		tamanho?: string;
	};
	onColorChange: (skuId: string, codCor: string) => void;
}

export function ColorPickerDialog({
	sku,
	onColorChange,
}: ColorPickerDialogProps) {
	const { t } = useTranslation();
	const [selectedColor, setSelectedColor] = useState(
		sku.codCor ? `#${sku.codCor.toString().padStart(6, "0")}` : "#000000"
	);
	const [isOpen, setIsOpen] = useState(false);

	const handleColorChange = (color: { hex: string }) => {
		setSelectedColor(color.hex);
	};

	const handleSave = () => {
		// Converter hex para string (remover #)
		const codCor = selectedColor.replace("#", "");
		onColorChange(sku.publicId, codCor);
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0"
					title={t("products.skus.actions.selectColor")}
				>
					<Palette className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>
						{t("products.skus.selectColor")} - {sku.cor || sku.tamanho || "SKU"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="flex justify-center">
						<Sketch
							color={selectedColor}
							onChange={handleColorChange}
							disableAlpha
						/>
					</div>
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							{t("common.cancel")}
						</Button>
						<Button onClick={handleSave}>{t("common.save")}</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
