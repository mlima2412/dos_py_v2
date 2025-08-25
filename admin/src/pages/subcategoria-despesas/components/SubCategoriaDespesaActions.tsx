import { HoverActions } from "@/components/ui/HoverActions";
import { useSubCategoriaDespesaControllerUpdate } from "@/api-client";
import { useToast } from "@/hooks/useToast";
import { useStandardActions } from "@/hooks/useStandardActions";
import type { SubCategoriaDespesaControllerFindAll200 } from "@/api-client/types";

type SubCategoriaDespesaItem = SubCategoriaDespesaControllerFindAll200[0];

interface SubCategoriaDespesaActionsProps {
	subcategoria: SubCategoriaDespesaItem;
}

export const SubCategoriaDespesaActions = ({
	subcategoria,
}: SubCategoriaDespesaActionsProps) => {
	const { mutate: updateSubCategoria } =
		useSubCategoriaDespesaControllerUpdate();
	const { success, error } = useToast();

	const handleToggleStatus = () => {
		updateSubCategoria(
			{
				id: subcategoria.idSubCategoria!,
				data: {
					ativo: !subcategoria.ativo,
				},
			},
			{
				onSuccess: () => {
					success(
						subcategoria.ativo
							? "Subcategoria inativada com sucesso"
							: "Subcategoria ativada com sucesso"
					);
				},
				onError: () => {
					error("Erro ao alterar status da subcategoria");
				},
			}
		);
	};

	const actions = useStandardActions({
		editHref: `/subtipos-despesa/editar/${subcategoria.idSubCategoria}`,
		isActive: subcategoria.ativo ?? false,
		onToggle: handleToggleStatus,
	});

	return <HoverActions actions={actions} />;
};
