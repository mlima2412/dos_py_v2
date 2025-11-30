import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import fetchClient from "@/lib/fetch-client";

export function SalesReportsPage() {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const { selectedPartnerId } = usePartner();
	const [availableYears, setAvailableYears] = useState<number[]>([]);
	const [selectedYear, setSelectedYear] = useState("all");
	const [isLoadingYears, setIsLoadingYears] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchYears = async () => {
			if (!selectedPartnerId) {
				setAvailableYears([]);
				return;
			}

			setIsLoadingYears(true);
			setError(null);
			try {
				const response = await fetchClient({
					url: `/dashboard/vendas/anos?parceiroId=${selectedPartnerId}`,
					method: "GET",
				});
				const years = (response.data as Array<{ ano: number }>).map(
					item => item.ano
				);
				setAvailableYears(years);
			} catch (err) {
				console.error("Error fetching sales years:", err);
				setError(t("sales.reports.errorLoadingYears") || "Error");
				setAvailableYears([]);
			} finally {
				setIsLoadingYears(false);
			}
		};

		void fetchYears();
	}, [selectedPartnerId, t]);

	const handleGenerateReport = () => {
		const params = new URLSearchParams({
			year: selectedYear,
		});
		navigate(`/pedidoVendas/relatorio/imprimir?${params.toString()}`);
	};

	const isGenerateDisabled =
		!selectedPartnerId || isLoadingYears || (!availableYears.length && selectedYear !== "all");

	return (
		<div className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{t("menu.reports.sales")}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("sales.reports.title")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						{t("sales.reports.description")}
					</p>

					<div className="grid gap-2 max-w-xs">
						<label htmlFor="year" className="text-sm font-medium">
							{t("sales.reports.year")}
						</label>
						{isLoadingYears ? (
							<div className="flex items-center justify-center h-10">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : (
							<Select
								value={selectedYear}
								onValueChange={setSelectedYear}
								disabled={!selectedPartnerId}
							>
								<SelectTrigger id="year">
									<SelectValue placeholder={t("sales.reports.selectYear")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("sales.reports.allYears")}
									</SelectItem>
									{availableYears.map(year => (
										<SelectItem key={year} value={year.toString()}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						{error && <p className="text-xs text-destructive">{error}</p>}
					</div>

					{!selectedPartnerId && (
						<p className="text-sm text-muted-foreground">
							{t("sales.reports.selectPartner")}
						</p>
					)}

					<Button onClick={handleGenerateReport} disabled={isGenerateDisabled}>
						{t("sales.reports.generate")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export default SalesReportsPage;
