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
import { useActivateUser, useDeactivateUser } from '../../../hooks/useUserMutations';
import { useToast } from '../../../hooks/useToast';
import { type UsuarioWithRelations } from '../../../hooks/useUsers';

const columnHelper = createColumnHelper<UsuarioWithRelations>();

export const createColumns = (
  t: (key: string) => string,
  activateUser: ReturnType<typeof useActivateUser>,
  deactivateUser: ReturnType<typeof useDeactivateUser>,
  toast: ReturnType<typeof useToast>,
) => [
  columnHelper.accessor('nome', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        {t('users.name')}
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
  columnHelper.accessor('email', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        {t('users.email')}
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
      <div className="text-muted-foreground">{row.getValue('email')}</div>
    ),
  }),
  columnHelper.accessor('telefone', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        {t('users.phone')}
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue('telefone') || '-'}</div>,
  }),

  columnHelper.accessor('ativo', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        {t('users.status.label')}
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const ativo = row.getValue('ativo') as boolean;
      return (
        <Badge variant={ativo ? 'default' : 'destructive'}>
          {ativo ? t('users.status.active') : t('users.status.inactive')}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: t('users.common.actions'),
    cell: ({ row }) => {
      const user = row.original;

      const handleToggleStatus = () => {
        if (user.ativo) {
          deactivateUser.mutate(user.publicId, {
            onSuccess: () => {
              toast.success(t('users.messages.deactivateSuccess'));
            },
            onError: () => {
              toast.error(t('users.messages.deactivateError'));
            },
          });
        } else {
          activateUser.mutate(user.publicId, {
            onSuccess: () => {
              toast.success(t('users.messages.activateSuccess'));
            },
            onError: () => {
              toast.error(t('users.messages.activateError'));
            },
          });
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t('users.common.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/usuarios/editar/${user.publicId}`}>
                {t('users.common.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleStatus}>
              {user.ativo ? t('users.common.deactivate') : t('users.common.activate')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];
