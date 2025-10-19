import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ItemSelectorProps<T extends { id: number; nome: string }> {
	items: T[];
	selectedItemId: number | null;
	onItemSelect: (itemId: number) => void;
	isLoading?: boolean;
	error?: unknown;
	disabled?: boolean;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	loadingMessage?: string;
	errorMessage?: string;
	label?: string;
}

export function ItemSelector<T extends { id: number; nome: string }>({
	items,
	selectedItemId,
	onItemSelect,
	isLoading = false,
	error = null,
	disabled = false,
	placeholder,
	searchPlaceholder,
	emptyMessage,
	loadingMessage,
	errorMessage,
	label,
}: ItemSelectorProps<T>) {
	const { t } = useTranslation("common");
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	const selectedItem = items.find(item => item.id === selectedItemId);

	// Filtrar itens por busca
	const filteredItems = useMemo(() => {
		if (!searchValue) return items;
		return items.filter(item =>
			item.nome.toLowerCase().includes(searchValue.toLowerCase())
		);
	}, [items, searchValue]);

	const handleSelect = (itemId: number) => {
		if (disabled) return;
		onItemSelect(itemId);
		setOpen(false);
		setSearchValue("");
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-muted-foreground">
					{loadingMessage || t("common.loading")}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-destructive">
					{errorMessage || t("common.loadError")}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{label && <label className="text-sm font-medium">{label}</label>}
			<Popover open={open && !disabled} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={disabled}
					>
						<span
							className={cn(
								"truncate",
								!selectedItem && "text-muted-foreground"
							)}
						>
							{selectedItem
								? selectedItem.nome
								: placeholder || t("common.search")}
						</span>
						<ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command>
						<CommandInput
							placeholder={searchPlaceholder || t("common.search")}
							value={searchValue}
							onValueChange={setSearchValue}
						/>
						<CommandList>
							<CommandEmpty>
								{emptyMessage || t("common.noResults")}
							</CommandEmpty>
							<CommandGroup>
								{filteredItems.map(item => (
									<CommandItem
										key={item.id}
										value={item.nome}
										onSelect={() => handleSelect(item.id)}
									>
										{item.nome}
										{selectedItemId === item.id && (
											<CheckIcon className="ml-auto h-4 w-4" />
										)}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
