import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type Parceiro } from '../../../api-client/index';
import { useActivateParceiro, useDeactivateParceiro } from '../../../hooks/useParceiroMutations';
import { useToast } from '../../../hooks/useToast';

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
    header: t('partners.common.actions'),
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

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t('partners.common.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/parceiros/editar/${parceiro.publicId}`}>
                {t('partners.common.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleStatus}>
              {parceiro.ativo ? t('partners.common.deactivate') : t('partners.common.activate')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];