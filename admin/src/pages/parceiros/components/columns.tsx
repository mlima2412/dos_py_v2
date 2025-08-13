import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Power, PowerOff } from 'lucide-react';
import { type Parceiro } from '../../../api-client/index';
import { useActivateParceiro, useDeactivateParceiro } from '../../../hooks/useParceiroMutations';
import { useToast } from '../../../hooks/useToast';
import { HoverActions } from '@/components/ui/HoverActions';

const columnHelper = createColumnHelper<Parceiro>();

export const createColumns = (
  t: (key: string) => string,
  activateParceiro: ReturnType<typeof useActivateParceiro>,
  deactivateParceiro: ReturnType<typeof useDeactivateParceiro>,
  toast: ReturnType<typeof useToast>,
) => [
  columnHelper.accessor('nome', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        {t('partners.name')}
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('nome')}</div>
    ),
  }),
  columnHelper.accessor('telefone', {
    header: t('partners.phone'),
    cell: ({ row }) => <div>{row.getValue('telefone') || '-'}</div>,
  }),
  columnHelper.accessor('email', {
    header: t('partners.email'),
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue('email')}</div>
    ),
  }),
  columnHelper.accessor('ativo', {
    header: t('partners.status.label'),
    cell: ({ row }) => {
      const ativo = row.getValue('ativo') as boolean;
      return (
        <Badge variant={ativo ? 'default' : 'destructive'}>
          {ativo ? t('partners.status.active') : t('partners.status.inactive')}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const parceiro = row.original;

      const handleToggleStatus = () => {
        if (parceiro.ativo) {
          deactivateParceiro.mutate({ publicId: parceiro.publicId }, {
            onSuccess: () => {
              toast.success(t('partners.messages.deactivateSuccess'));
            },
            onError: () => {
              toast.error(t('partners.messages.deactivateError'));
            },
          });
        } else {
          activateParceiro.mutate({ publicId: parceiro.publicId }, {
            onSuccess: () => {
              toast.success(t('partners.messages.activateSuccess'));
            },
            onError: () => {
              toast.error(t('partners.messages.activateError'));
            },
          });
        }
      };

      const actions = [
        {
          type: 'edit' as const,
          label: t('common.edit'),
          icon: <Edit className="h-4 w-4" />,
          href: `/parceiros/editar/${parceiro.publicId}`,
        },
        {
          type: 'toggle' as const,
          label: parceiro.ativo ? t('common.deactivate') : t('common.activate'),
          icon: parceiro.ativo ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          ),
          onClick: handleToggleStatus,
          variant: parceiro.ativo ? 'destructive' as const : 'default' as const,
        },
      ];

      return <HoverActions actions={actions} />;
    },
  }),
];