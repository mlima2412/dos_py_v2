import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, MoreHorizontal } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCanais,
  useActivateCanal,
  useDeactivateCanal,
} from '@/hooks/useCanais';
import type { CanalOrigem } from '@/api-client/types';

export function ListarCanaisOrigem() {
  const { t } = useTranslation();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const { data: canaisOrigem, isLoading, error } = useCanais();
  const activateMutation = useActivateCanal();
  const deactivateMutation = useDeactivateCanal();

  const handleToggleStatus = async (canal: CanalOrigem) => {
    setLoadingAction(canal.publicId);
    try {
      if (canal.ativo) {
        await deactivateMutation.mutateAsync({ publicId: canal.publicId });
      } else {
        await activateMutation.mutateAsync({ publicId: canal.publicId });
      }
    } finally {
      setLoadingAction(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-4">{t('common.errorLoading')}</p>
            <Button onClick={() => window.location.reload()}>
              {t('common.tryAgain')}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">{t('navigation.home')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {t('administration.originChannels')}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button variant="outline" size="sm" asChild>
            <Link to="/canais-origem/novo">
              <Plus className="mr-2 h-4 w-4" />
              {t('originChannels.create')}
            </Link>
          </Button>
        </div>

        {/* Lista de Canais */}
        <Card>
          <CardHeader>
            <CardTitle>{t('originChannels.list')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!canaisOrigem || canaisOrigem.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t('originChannels.noChannels')}
                </p>
                <Button asChild>
                  <Link to="/canais-origem/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('originChannels.createFirst')}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('originChannels.name')}</TableHead>
                    <TableHead>{t('originChannels.status')}</TableHead>
                    <TableHead className="text-right">
                      {t('common.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canaisOrigem.map((canal) => (
                    <TableRow key={canal.id}>
                      <TableCell className="font-medium">
                        {canal.nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant={canal.ativo ? 'default' : 'secondary'}>
                          {canal.ativo
                            ? t('common.active')
                            : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">
                                {t('common.actions')}
                              </span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/canais-origem/editar/${canal.publicId}`}
                              >
                                {t('common.edit')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(canal)}
                              disabled={loadingAction === canal.publicId}
                            >
                              {loadingAction === canal.publicId ? (
                                <Spinner size="sm" className="mr-2" />
                              ) : null}
                              {canal.ativo
                                ? t('common.deactivate')
                                : t('common.activate')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
