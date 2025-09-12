import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FormSwitchProps {
	label: string;
	description: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
}

export const FormSwitch = ({
	label,
	description,
	checked,
	onCheckedChange,
	disabled,
}: FormSwitchProps) => {
	return (
		<div className="flex flex-row items-center justify-between rounded-lg border p-4">
			<div className="space-y-0.5">
				<Label className="text-base">{label}</Label>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			<Switch
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
			/>
		</div>
	);
};
