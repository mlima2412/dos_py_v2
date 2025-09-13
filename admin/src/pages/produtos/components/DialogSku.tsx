import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Save, X } from "lucide-react";

import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

// Função para criar schema com traduções
const createFormSchema = (t: (key: string) => string) =>
	z.object({
		cor: z.string().min(1, t("products.skus.validations.colorRequired")),
		tamanho: z.string().min(1, t("products.skus.validations.sizeRequired")),
		qtdMinima: z
			.number()
			.min(0, t("products.skus.validations.minQuantityMin"))
			.default(0),
	});

interface DialogSkuProps {
	onSubmit: (data: any) => void;
	onClose: () => void;
	editingSku?: any;
	onUpdate?: (data: any) => void;
}

export function DialogSku({
	onSubmit,
	onClose,
	editingSku,
	onUpdate,
}: DialogSkuProps) {
	const { t } = useTranslation();
	const isEditing = Boolean(editingSku);

	// Criar schema com traduções
	const formSchema = createFormSchema(t);
	type FormData = z.infer<typeof formSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			cor: "",
			tamanho: "",
			qtdMinima: 0,
		},
	});

	// Populate form when editing
	useEffect(() => {
		if (editingSku) {
			form.reset({
				cor: editingSku.cor || "",
				tamanho: editingSku.tamanho || "",
				qtdMinima: editingSku.qtdMinima || 0,
			});
		}
	}, [editingSku, form]);

	const handleSubmit = (data: FormData) => {
		if (isEditing && onUpdate) {
			onUpdate(data);
		} else {
			onSubmit(data);
		}
	};

	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>
					{isEditing ? t("products.skus.editSku") : t("products.skus.newSku")}
				</DialogTitle>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="cor"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("products.skus.color")} ({t("common.optional")})
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("products.skus.placeholders.color")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="tamanho"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("products.skus.size")} ({t("common.optional")})
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("products.skus.placeholders.size")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="qtdMinima"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("products.skus.minQuantity")}</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="0"
										placeholder={t("products.skus.placeholders.minQuantity")}
										{...field}
										onChange={e =>
											field.onChange(parseInt(e.target.value) || 0)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex justify-end space-x-2">
						<Button type="button" variant="outline" onClick={onClose}>
							<X className="mr-2 h-4 w-4" />
							{t("common.cancel")}
						</Button>
						<Button type="submit">
							<Save className="mr-2 h-4 w-4" />
							{isEditing ? t("common.update") : t("common.create")}
						</Button>
					</div>
				</form>
			</Form>
		</DialogContent>
	);
}
