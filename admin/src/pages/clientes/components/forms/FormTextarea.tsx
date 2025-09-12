import { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FormTextareaProps {
	id: string;
	label: string;
	placeholder: string;
	disabled?: boolean;
	error?: string;
	required?: boolean;
	optional?: boolean;
	rows?: number;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
	(
		{
			id,
			label,
			placeholder,
			disabled,
			error,
			required,
			optional,
			rows = 3,
			...props
		},
		ref
	) => {
		return (
			<div className="space-y-2">
				<Label htmlFor={id}>
					{label} {required && "*"} {optional && "(Opcional)"}
				</Label>
				<Textarea
					id={id}
					placeholder={placeholder}
					disabled={disabled}
					rows={rows}
					ref={ref}
					{...props}
				/>
				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>
		);
	}
);

FormTextarea.displayName = "FormTextarea";
