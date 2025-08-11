import { HoverActions } from '@/components/ui/HoverActions';
import { useCategoriaDespesasControllerUpdate } from '@/api-client';
import { useToast } from '@/hooks/useToast';
import { useStandardActions } from '@/hooks/useStandardActions';
import type { CategoriaDespesasControllerFindAll200 } from '@/api-client/types';

type CategoriaDespesasItem = CategoriaDespesasControllerFindAll200[0];

interface CategoriaDespesasActionsProps {
  categoria: CategoriaDespesasItem;
}

export const CategoriaDespesasActions = ({ categoria }: CategoriaDespesasActionsProps) => {
  const { mutate: updateCategoria } = useCategoriaDespesasControllerUpdate();
  const { success, error } = useToast();

  const handleToggleStatus = () => {
    updateCategoria(
      {
        id: categoria.idCategoria!,
        data: {
          ativo: !categoria.ativo,
        },
      },
      {
        onSuccess: () => {
          success(
            categoria.ativo
              ? 'Categoria inativada com sucesso'
              : 'Categoria ativada com sucesso'
          );
        },
        onError: () => {
          error('Erro ao alterar status da categoria');
        },
      }
    );
  };

  const actions = useStandardActions({
    editHref: `/tipos-despesa/editar/${categoria.idCategoria}`,
    isActive: categoria.ativo ?? false,
    onToggle: handleToggleStatus,
  });

  return <HoverActions actions={actions} />;
};