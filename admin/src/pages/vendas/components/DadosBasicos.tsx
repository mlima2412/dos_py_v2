import React from "react";
import { useTranslation } from "react-i18next";
import { Controller, Control } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ClientSelector } from "@/components";
import { cn } from "@/lib/utils";
import type { VendaFormMode, VendaFormValues, LocalOption } from "../types";
import type { VendaTipoEnum } from "@/api-client/types";

interface DadosBasicosProps {
	mode: VendaFormMode;
	control: Control<VendaFormValues>;
	selectedPartnerId: string;
	locaisOptions: LocalOption[];
	isLoadingLocais: boolean;
	onSave: () => Promise<void>;
	isSaving: boolean;
}

const DATE_FORMAT = "dd/MM/yyyy";

export const DadosBasicos: React.FC<DadosBasicosProps> = ({
	mode,
	control,
	selectedPartnerId,
	locaisOptions,
	isLoadingLocais,
	onSave,
	isSaving,
}) => {
	const { t } = useTranslation("common");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("salesOrders.form.sections.basic")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-2">
						<Controller
							name="clienteId"
							control={control}
							render={({ field }) => (
								<ClientSelector
									parceiroId={selectedPartnerId}
									selectedClientId={field.value ? Number(field.value) : null}
									onClientSelect={clientId => field.onChange(clientId)}
									disabled={mode === "view"}
									placeholder={t("salesOrders.form.placeholders.client")}
								/>
							)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.location")}</Label>
						<Controller
							name="localSaidaId"
							control={control}
							render={({ field }) => (
								<Select
									disabled={mode === "view" || isLoadingLocais}
									value={field.value ? String(field.value) : undefined}
									onValueChange={value => field.onChange(Number(value))}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t("salesOrders.form.placeholders.location")}
										/>
									</SelectTrigger>
									<SelectContent>
										{locaisOptions.map(local => (
											<SelectItem key={local.id} value={String(local.id)}>
												{local.nome}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.saleType")}</Label>
						<Controller
							name="tipo"
							control={control}
							render={({ field }) => (
								<Select
									disabled={mode === "view"}
									value={field.value}
									onValueChange={value =>
										field.onChange(value as VendaTipoEnum)
									}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t("salesOrders.form.placeholders.saleType")}
										/>
									</SelectTrigger>
									<SelectContent>
										{["DIRETA", "CONDICIONAL", "BRINDE"].map(option => (
											<SelectItem key={option} value={option}>
												{t(`salesOrders.types.${option}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.saleDate")}</Label>
						<Controller
							name="dataVenda"
							control={control}
							render={({ field }) => (
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!field.value && "text-muted-foreground"
											)}
											disabled={mode === "view"}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{field.value
												? format(field.value, DATE_FORMAT)
												: t("salesOrders.form.placeholders.saleDate")}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={field.value}
											onSelect={field.onChange}
										/>
									</PopoverContent>
								</Popover>
							)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("salesOrders.form.labels.deliveryDate")}</Label>
						<Controller
							name="dataEntrega"
							control={control}
							render={({ field }) => (
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!field.value && "text-muted-foreground"
											)}
											disabled={mode === "view"}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{field.value
												? format(field.value, DATE_FORMAT)
												: t("salesOrders.form.placeholders.deliveryDate")}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={field.value || undefined}
											onSelect={date => field.onChange(date ?? null)}
										/>
									</PopoverContent>
								</Popover>
							)}
						/>
					</div>
				</div>
				<div>
					<Label>{t("salesOrders.form.labels.observation")}</Label>
					<Controller
						name="observacao"
						control={control}
						render={({ field }) => (
							<Textarea
								{...field}
								disabled={mode === "view"}
								placeholder={t("salesOrders.form.placeholders.observation")}
								className="min-h-[120px]"
							/>
						)}
					/>
				</div>
				{mode !== "view" && (
					<div className="flex justify-end">
						<Button onClick={onSave} disabled={isSaving}>
							{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("salesOrders.form.actions.saveAndContinue")}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
