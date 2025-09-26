import React from "react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export interface SupplierOption {
	id: string;
	nome: string;
}

interface SearchAndFilterBarLabels {
	searchPlaceholder: string;
	supplierPlaceholder: string;
	allSuppliers: string;
	createLabel: string;
}

interface SearchAndFilterBarProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	selectedSupplier: string;
	onSupplierChange: (value: string) => void;
	suppliers: SupplierOption[];
	createHref: string;
	labels: SearchAndFilterBarLabels;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
	searchValue,
	onSearchChange,
	selectedSupplier,
	onSupplierChange,
	suppliers,
	createHref,
	labels,
}) => {
	return (
		<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
			<div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
				<Input
					placeholder={labels.searchPlaceholder}
					value={searchValue}
					onChange={event => onSearchChange(event.target.value)}
					className="w-full sm:w-80"
				/>

				<Select value={selectedSupplier} onValueChange={onSupplierChange}>
					<SelectTrigger className="w-full sm:w-60">
						<SelectValue placeholder={labels.supplierPlaceholder} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{labels.allSuppliers}</SelectItem>
						{suppliers.map(supplier => (
							<SelectItem key={supplier.id} value={supplier.id}>
								{supplier.nome}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Button asChild className="w-full sm:w-auto">
				<Link to={createHref}>
					<Plus className="mr-2 h-4 w-4" />
					{labels.createLabel}
				</Link>
			</Button>
		</div>
	);
};
