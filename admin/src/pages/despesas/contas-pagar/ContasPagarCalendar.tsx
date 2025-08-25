import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventCalendar } from "@/components/EventCalendar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslation } from "react-i18next";

export function ContasPagarCalendar() {
	const { t } = useTranslation();

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">{t("menu.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/despesas">
								{t("expenses.title")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Contas a Pagar</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Calendário de eventos */}
				<EventCalendar className="w-full" />
			</div>
		</DashboardLayout>
	);
}

export default ContasPagarCalendar;
