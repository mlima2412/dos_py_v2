import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { useClienteData } from "@/hooks/useClienteData";
import { useClienteForm } from "@/hooks/useClienteForm";
import { FormHeader } from "./components/forms/FormHeader";
import { FormActions } from "./components/forms/FormActions";
import { FormField } from "./components/forms/FormField";
import { FormSelect } from "./components/forms/FormSelect";
import { FormSwitch } from "./components/forms/FormSwitch";
import { FormTextarea } from "./components/forms/FormTextarea";
import { CLIENTE_FORM_GRID_CLASSES } from "@/constants/clienteConstants";

export function FormularioCliente() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const location = useLocation();

	const isEditing = Boolean(id);
	const isViewing = location.pathname.includes("/visualizar/");

	// Hooks customizados
	const {
		cliente,
		parceiros,
		canaisOrigem,
		isLoadingCliente,
		isLoadingParceiros,
		isLoadingCanaisOrigem,
	} = useClienteData(id, isEditing);

	const { form, onSubmit, isSubmitting } = useClienteForm({
		cliente,
		isEditing,
		parceiros,
	});

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = form;

	// Loading state
	if (isLoadingCliente) {
		return (
			<div className="flex items-center justify-center h-64">
				<Spinner size="lg" />
			</div>
		);
	}

	// Watch values for dynamic components
	const ativoValue = watch("ativo");

	// Options for selects
	const parceiroOptions = parceiros
		.filter(parceiro => parceiro.id)
		.map(parceiro => ({
			value: parceiro.id!.toString(),
			label: parceiro.nome,
		}));

	const canalOrigemOptions = canaisOrigem
		.filter(canal => canal.id)
		.map(canal => ({
			value: canal.id!.toString(),
			label: canal.nome,
		}));

	const linguagemOptions = [
		{ value: "Portugues", label: t("clients.labels.portuguese") },
		{ value: "Espanol", label: t("clients.labels.spanish") },
	];

	return (
		<div className="space-y-6">
			<FormHeader isViewing={isViewing} isEditing={isEditing} />

			<Card>
				<CardContent className="p-6">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
						{/* Primeira linha: Nome RUC/CNPJ */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								id="nome"
								label={t("clients.labels.name")}
								placeholder={t("clients.placeholders.name")}
								disabled={isViewing}
								error={errors.nome?.message}
								required
								{...register("nome")}
							/>

							<FormField
								id="ruccnpj"
								label={t("clients.labels.ruccnpj")}
								placeholder={t("clients.placeholders.ruccnpj")}
								disabled={isViewing}
								{...register("ruccnpj")}
							/>
						</div>

						{/* Segunda linha: Email, Celular, Rede Social */}
						<div className={CLIENTE_FORM_GRID_CLASSES.row}>
							<FormField
								id="email"
								label={t("clients.labels.email")}
								placeholder={t("clients.placeholders.email")}
								disabled={isViewing}
								error={errors.email?.message}
								{...register("email")}
							/>
							<FormField
								id="celular"
								label={t("clients.labels.cellphone")}
								placeholder={t("clients.placeholders.cellphone")}
								disabled={isViewing}
								optional
								{...register("celular")}
							/>
							<FormField
								id="redeSocial"
								label={t("clients.labels.socialMedia")}
								placeholder={t("clients.placeholders.socialMedia")}
								disabled={isViewing}
								optional
								{...register("redeSocial")}
							/>
						</div>

						{/* Terceira linha: Parceiro, Linguagem, Canal de Origem */}
						<div className={CLIENTE_FORM_GRID_CLASSES.row}>
							<FormSelect
								id="parceiroId"
								label={t("clients.labels.partner")}
								placeholder={t("clients.placeholders.partner")}
								options={parceiroOptions}
								value={watch("parceiroId")}
								onValueChange={value => setValue("parceiroId", value)}
								disabled={isLoadingParceiros || isViewing}
								error={errors.parceiroId?.message}
								required
							/>
							<FormSelect
								id="linguagem"
								label={t("clients.labels.language")}
								placeholder={t("clients.placeholders.language")}
								options={linguagemOptions}
								value={watch("linguagem")}
								onValueChange={value =>
									setValue(
										"linguagem",
										value === ""
											? undefined
											: (value as "Espanol" | "Portugues")
									)
								}
								disabled={isViewing}
								optional
							/>
							<FormSelect
								id="canalOrigemId"
								label={t("clients.labels.originChannel")}
								placeholder={t("clients.placeholders.originChannel")}
								options={canalOrigemOptions}
								value={watch("canalOrigemId") ?? ""}
								onValueChange={value => setValue("canalOrigemId", value)}
								disabled={isLoadingCanaisOrigem || isViewing}
								optional
							/>
						</div>

						{/* Quarta linha: Endereço, Cidade, CEP */}
						<div className={CLIENTE_FORM_GRID_CLASSES.row}>
							<FormField
								id="endereco"
								label={t("clients.labels.address")}
								placeholder={t("clients.placeholders.address")}
								disabled={isViewing}
								optional
								{...register("endereco")}
							/>
							<FormField
								id="cidade"
								label={t("clients.labels.city")}
								placeholder={t("clients.placeholders.city")}
								disabled={isViewing}
								optional
								{...register("cidade")}
							/>
							<FormField
								id="cep"
								label={t("clients.labels.zipCode")}
								placeholder={t("clients.placeholders.zipCode")}
								disabled={isViewing}
								optional
								{...register("cep")}
							/>
						</div>

						{/* Quinta linha: Status, RUC/CNPJ Secundário, Nome para Fatura */}
						<div className={CLIENTE_FORM_GRID_CLASSES.row}>
							<FormSwitch
								label={t("clients.labels.status")}
								description={
									ativoValue
										? t("clients.labels.active")
										: t("clients.labels.inactive")
								}
								checked={ativoValue}
								onCheckedChange={checked => setValue("ativo", checked)}
								disabled={isViewing}
							/>
						</div>

						{/* Sexta linha: Observações */}
						<div className="grid grid-cols-1 gap-4">
							<FormTextarea
								id="observacoes"
								label={t("clients.labels.observations")}
								placeholder={t("clients.placeholders.observations")}
								disabled={isViewing}
								optional
								rows={3}
								{...register("observacoes")}
							/>
						</div>

						<FormActions
							isViewing={isViewing}
							isSubmitting={isSubmitting}
							isEditing={isEditing}
						/>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
