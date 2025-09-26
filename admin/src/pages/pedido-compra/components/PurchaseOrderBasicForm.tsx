import React from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CurrencyInput from "react-currency-input-field";
import type { UseFormReturn } from "react-hook-form";
import type { TFunction } from "i18next";
import type { Fornecedor, LocalEstoque, Currency } from "@/api-client/types";
import type { PedidoCompraBasicFormData } from "../pedidoCompraSchema";

interface PurchaseOrderBasicFormProps {
	form: UseFormReturn<PedidoCompraBasicFormData>;
	fornecedores: Fornecedor[];
	locais: LocalEstoque[];
	currencies: Currency[];
	isLoadingFornecedores: boolean;
	isLoadingLocations: boolean;
	isLoadingCurrencies: boolean;
	isFornecedorLocked: boolean;
	isCotacaoLocked: boolean;
	isCurrencyLocked: boolean;
	parceiroIdNumber: number | null;
	onSubmit: (values: PedidoCompraBasicFormData) => void;
	onCancel: () => void;
	onLocalChange: (localId: number) => void;
	refreshTotals: (patch?: Partial<PedidoCompraBasicFormData>) => void;
	isSaving: boolean;
	t: TFunction<"common">;
}

export const PurchaseOrderBasicForm: React.FC<PurchaseOrderBasicFormProps> = ({
	form,
	fornecedores,
	locais,
	currencies,
	isLoadingFornecedores,
	isLoadingLocations,
	isLoadingCurrencies,
	isFornecedorLocked,
	isCotacaoLocked,
	isCurrencyLocked,
	parceiroIdNumber,
	onSubmit,
	onCancel,
	onLocalChange,
	refreshTotals,
	isSaving,
	t,
}) => {
	return (
		<Form {...form}>
			<form
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				onSubmit={form.handleSubmit(onSubmit as any)}
				className="space-y-6"
			>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<FormField
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						control={form.control as any}
						name="fornecedorId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("purchaseOrders.form.labels.supplier")} *
								</FormLabel>
								<Select
									onValueChange={value => {
										field.onChange(value);
									}}
									value={field.value}
									disabled={
										isLoadingFornecedores ||
										!parceiroIdNumber ||
										fornecedores.length === 0 ||
										isFornecedorLocked
									}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"purchaseOrders.form.placeholders.supplier"
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{isLoadingFornecedores ? (
											<SelectItem value="loading" disabled>
												{t("common.loading")}
											</SelectItem>
										) : fornecedores.length === 0 ? (
											<SelectItem value="empty" disabled>
												{t("purchaseOrders.form.noSuppliers", {
													defaultValue: "Nenhum fornecedor disponível",
												})}
											</SelectItem>
										) : (
											fornecedores.map(supplier => (
												<SelectItem
													key={supplier.id}
													value={supplier.id!.toString()}
												>
													{supplier.nome}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						control={form.control as any}
						name="localEntradaId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("purchaseOrders.form.labels.entryLocation")} *
								</FormLabel>
								<Select
									onValueChange={value => {
										field.onChange(value);
										onLocalChange(Number(value));
									}}
									value={field.value}
									disabled={isLoadingLocations || locais.length === 0}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"purchaseOrders.form.placeholders.entryLocation"
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{locais.length === 0 ? (
											<SelectItem value="empty" disabled>
												{t("purchaseOrders.form.noLocations", {
													defaultValue: "Nenhum local disponível",
												})}
											</SelectItem>
										) : (
											locais.map((local: LocalEstoque) => (
												<SelectItem
													key={local.id}
													value={local.id!.toString()}
												>
													{local.nome}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						control={form.control as any}
						name="consignado"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<FormLabel className="text-base">
										{t("purchaseOrders.form.labels.consigned")}
									</FormLabel>
								</div>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						control={form.control as any}
						name="currencyId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("purchaseOrders.form.labels.currency")} *
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={
										isLoadingCurrencies || currencies.length === 0 || isCurrencyLocked
									}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"purchaseOrders.form.placeholders.currency"
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{isLoadingCurrencies ? (
											<SelectItem value="loading" disabled>
												{t("common.loading")}
											</SelectItem>
										) : currencies.length === 0 ? (
											<SelectItem value="empty" disabled>
												{t("purchaseOrders.form.noCurrencies", {
													defaultValue: "Nenhuma moeda disponível",
												})}
											</SelectItem>
										) : (
											currencies.map(currency => (
												<SelectItem
													key={currency.id}
													value={currency.id!.toString()}
												>
													{currency.prefixo} {currency.nome} (
													{currency.isoCode})
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						control={form.control as any}
						name="cotacao"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("purchaseOrders.form.labels.exchangeRate")}
								</FormLabel>
								<FormControl>
									<CurrencyInput
										id="cotacao"
										name="cotacao"
										placeholder={t(
											"purchaseOrders.form.placeholders.exchangeRate"
										)}
										value={field.value}
										decimalsLimit={2}
										onValueChange={value => {
											const nextValue = value || "";
											field.onChange(nextValue);
											refreshTotals({ cotacao: nextValue });
										}}
										disabled={isCotacaoLocked}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						control={form.control as any}
						name="valorFrete"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("purchaseOrders.form.labels.freightValue")}
								</FormLabel>
								<FormControl>
									<CurrencyInput
										id="valorFrete"
										name="valorFrete"
										placeholder={t(
											"purchaseOrders.form.placeholders.freightValue"
										)}
										value={field.value}
										decimalsLimit={2}
										onValueChange={value => {
											const nextValue = value || "";
											field.onChange(nextValue);
											refreshTotals({ valorFrete: nextValue });
										}}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						control={form.control as any}
						name="valorComissao"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("purchaseOrders.form.labels.commissionValue")}
								</FormLabel>
								<FormControl>
									<CurrencyInput
										id="valorComissao"
										name="valorComissao"
										placeholder={t(
											"purchaseOrders.form.placeholders.commissionValue"
										)}
										value={field.value}
										decimalsLimit={2}
										onValueChange={value => {
											const nextValue = value || "";
											field.onChange(nextValue);
											refreshTotals({ valorComissao: nextValue });
										}}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					control={form.control as any}
					name="observacao"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("purchaseOrders.form.labels.observation")}
							</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									placeholder={t(
										"purchaseOrders.form.placeholders.observation"
									)}
									rows={3}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isSaving}
					>
						{t("purchaseOrders.form.actions.cancel")}
					</Button>
					<Button type="submit" disabled={isSaving}>
						{isSaving
							? t("purchaseOrders.form.actions.saving")
							: t("purchaseOrders.form.actions.save")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
