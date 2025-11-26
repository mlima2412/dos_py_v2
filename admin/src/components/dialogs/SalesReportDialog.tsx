import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePartner } from "@/hooks/usePartner";
import fetchClient from "@/lib/fetch-client";

interface SalesReportDialogProps {
	currentYear: number;
}

export function SalesReportDialog({ currentYear }: SalesReportDialogProps) {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartner();
	const [open, setOpen] = useState(false);
	const [selectedYear, setSelectedYear] = useState(currentYear.toString());
	const [availableYears, setAvailableYears] = useState<number[]>([]);

	// Buscar anos disponíveis do Redis
	useEffect(() => {
		const fetchYears = async () => {
			if (!selectedPartnerId || !open) return;

			try {
				const response = await fetchClient({
					url: `/dashboard/vendas/anos?parceiroId=${selectedPartnerId}`,
					method: "GET",
				});
				const years = (response.data as any[]).map((y: any) => y.ano);
				setAvailableYears(years);
			} catch (err) {
				console.error("Error fetching years:", err);
			}
		};

		fetchYears();
	}, [selectedPartnerId, open]);

	const handleGenerateReport = () => {
		const params = new URLSearchParams({
			year: selectedYear,
		});
		navigate(`/pedidoVendas/relatorio/imprimir?${params.toString()}`);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="icon" className="h-8 w-8">
					<FileText className="h-4 w-4" />
					<span className="sr-only">{t("sales.reports.title")}</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("sales.reports.title")}</DialogTitle>
					<DialogDescription>
						{t("sales.reports.description")}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<label htmlFor="year" className="text-sm font-medium">
							{t("sales.reports.year")}
						</label>
						<Select value={selectedYear} onValueChange={setSelectedYear}>
							<SelectTrigger id="year">
								<SelectValue placeholder={t("sales.reports.selectYear")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("sales.reports.allYears")}
								</SelectItem>
								{availableYears.map((year) => (
									<SelectItem
										key={year}
										value={year.toString()}
									>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleGenerateReport}>
						{t("sales.reports.generate")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
