import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SelectOption {
	value: string;
	label: string;
}

interface FormSelectProps {
	id: string;
	label: string;
	placeholder: string;
	options: SelectOption[];
	value: string | undefined;
	onValueChange: (value: string) => void;
	disabled?: boolean;
	error?: string;
	required?: boolean;
	optional?: boolean;
}

export const FormSelect = ({
	id,
	label,
	placeholder,
	options,
	value,
	onValueChange,
	disabled,
	error,
	required,
	optional,
}: FormSelectProps) => {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>
				{label} {required && "*"} {optional && "(Opcional)"}
			</Label>
			<Select
				value={value || ""}
				onValueChange={onValueChange}
				disabled={disabled}
			>
				<SelectTrigger className={error ? "border-destructive" : ""}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map(option => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
};
