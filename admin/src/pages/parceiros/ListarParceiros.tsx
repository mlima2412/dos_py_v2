import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { useParceiros } from '@/hooks/useParceiros';
import { useResponsiveColumns } from './components/ResponsiveColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function ListarParceiros() {
  const { t } = useTranslation();
  const [globalFilter, setGlobalFilter] = useState('');
  const [ativoFilter, setAtivoFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useParceiros({
    search: debouncedGlobalFilter,
    ativo: ativoFilter === 'all' ? undefined : ativoFilter === 'true',
    limit: 20,
  });

  const flatData = useMemo(() => {
    const result = data?.pages?.flatMap((page) => page.data) ?? [];
    return result.filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [data]);

  const totalDBRowCount = data?.pages?.[0]?.total ?? 0;
  const totalFetched = flatData.length;

  const columns = useResponsiveColumns({ t, isMobile });

  const table = useReactTable({
    data: flatData,
    columns,
    pageCount: Math.ceil(totalDBRowCount / 20),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    debugTable: true,
  });

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">{t('common.home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('partners.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/parceiros/criar">
              <Plus className="mr-2 h-4 w-4" />
              {t('partners.create')}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('partners.list')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('partners.search')}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Select value={ativoFilter} onValueChange={setAtivoFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('partners.status.filter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('partners.status.all')}
                    </SelectItem>
                    <SelectItem value="true">
                      {t('partners.status.active')}
                    </SelectItem>
                    <SelectItem value="false">
                      {t('partners.status.inactive')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  {t('common.loading')}
                </div>
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-destructive">
                  {t('common.error')}
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : typeof header.column.columnDef.header ===
                                      'function'
                                    ? header.column.columnDef.header(
                                        header.getContext(),
                                      )
                                    : header.column.columnDef.header}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && 'selected'}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {typeof cell.column.columnDef.cell ===
                                  'function'
                                    ? cell.column.columnDef.cell(
                                        cell.getContext(),
                                      )
                                    : cell.getValue()}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              {t('partners.noResults')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    {t('common.showing')} {totalFetched} {t('common.of')}{' '}
                    {totalDBRowCount} {t('partners.results')}
                  </div>
                  {hasNextPage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage
                        ? t('common.loading')
                        : t('common.loadMore')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
