import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ContasPagarEmConstrucao() {
	const { t } = useTranslation();

	return (
		<DashboardLayout>
			<div className="container mx-auto p-6">
				<Card className="max-w-md mx-auto">
					<CardHeader className="text-center">
						<Construction className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
						<CardTitle className="text-2xl">
							{t("common.underConstruction")}
						</CardTitle>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground">
							{t("expenses.accountsPayable.comingSoon")}
						</p>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}

export default ContasPagarEmConstrucao;
