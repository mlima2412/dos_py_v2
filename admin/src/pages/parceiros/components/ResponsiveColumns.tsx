import { useMemo } from "react";
import { createColumns } from "./columns";
import {
	useActivateParceiro,
	useDeactivateParceiro,
} from "@/hooks/useParceiroMutations";
import { useToast } from "@/hooks/useToast";

interface ResponsiveColumnsProps {
	t: (key: string) => string;
	isMobile: boolean;
}

export const useResponsiveColumns = ({
	t,
	isMobile,
}: ResponsiveColumnsProps) => {
	const activateParceiro = useActivateParceiro();
	const deactivateParceiro = useDeactivateParceiro();
	const toast = useToast();

	const columns = useMemo(() => {
		const allColumns = createColumns(
			t,
			activateParceiro,
			deactivateParceiro,
			toast
		);

		if (isMobile) {
			// Em mobile, mostrar apenas Nome e Ativo
			return allColumns.filter(column => {
				if ("accessorKey" in column) {
					return (
						column.accessorKey === "nome" || column.accessorKey === "ativo"
					);
				}
				if ("id" in column) {
					return column.id === "actions";
				}
				return false;
			});
		}

		return allColumns;
	}, [t, isMobile, activateParceiro, deactivateParceiro, toast]);

	return columns;
};
