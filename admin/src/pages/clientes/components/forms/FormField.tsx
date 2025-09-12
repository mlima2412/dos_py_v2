import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
	id: string;
	label: string;
	placeholder: string;
	disabled?: boolean;
	error?: string;
	required?: boolean;
	optional?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
	(
		{ id, label, placeholder, disabled, error, required, optional, ...props },
		ref
	) => {
		return (
			<div className="space-y-2">
				<Label htmlFor={id}>
					{label} {required && "*"} {optional && "(Opcional)"}
				</Label>
				<Input
					id={id}
					placeholder={placeholder}
					disabled={disabled}
					className={error ? "border-destructive" : ""}
					ref={ref}
					{...props}
				/>
				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>
		);
	}
);

FormField.displayName = "FormField";
