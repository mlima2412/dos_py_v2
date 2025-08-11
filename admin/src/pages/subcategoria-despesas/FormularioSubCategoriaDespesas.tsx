import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Spinner } from '@/components/ui/spinner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useSubCategoriaDespesaControllerCreate,
  useSubCategoriaDespesaControllerUpdate,
  useSubCategoriaDespesaControllerFindOne,
  useCategoriaDespesasControllerFindAll,
} from '@/api-client';
import { useToast } from '@/hooks/useToast';

const FormularioSubCategoriaDespesas: React.FC = () => {
  const navigate = useNavigate();
  const { idSubCategoria } = useParams<{ idSubCategoria: string }>();
  const { t } = useTranslation();

  // Schema de validação
  const subCategoriaDespesaSchema = z.object({
    descricao: z
      .string()
      .min(1, t('expenseSubtypes.descriptionRequired'))
      .min(3, t('expenseSubtypes.descriptionMinLength'))
      .max(100, t('expenseSubtypes.descriptionMaxLength')),
    categoriaId: z
      .number({
        message: t('expenseSubtypes.categoryRequired'),
      })
      .min(1, t('expenseSubtypes.categoryRequired')),
  });

  type FormData = z.infer<typeof subCategoriaDespesaSchema>;
  const toast = useToast();

  const isEditing = Boolean(idSubCategoria);

  // Hooks de API
  const {
    data: subCategoria,
    isLoading: isLoadingSubCategoria,
    error: errorSubCategoria,
  } = useSubCategoriaDespesaControllerFindOne(
    Number(idSubCategoria),
    {
      query: {
        enabled: !!idSubCategoria && !isNaN(Number(idSubCategoria)),
      },
    }
  );

  const {
    data: categorias = [],
    isLoading: isLoadingCategorias,
  } = useCategoriaDespesasControllerFindAll();

  const createMutation = useSubCategoriaDespesaControllerCreate();
  const updateMutation = useSubCategoriaDespesaControllerUpdate();

  // Configuração do formulário
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(subCategoriaDespesaSchema),
    defaultValues: {
      descricao: '',
      categoriaId: undefined,
    },
  });

  // Preencher formulário quando carregando dados para edição
  React.useEffect(() => {
    if (subCategoria && isEditing) {
      reset({
        descricao: subCategoria.descricao || '',
        categoriaId: Number(subCategoria.categoriaId),
      });
    }
  }, [subCategoria, isEditing, reset]);

  // Função de submit
  const onSubmit = (data: FormData) => {
    if (isEditing && idSubCategoria) {
      updateMutation.mutate(
        {
          id: Number(idSubCategoria),
          data: {
            descricao: data.descricao,
            categoriaId: data.categoriaId,
            ativo: subCategoria?.ativo ?? true,
          },
        },
        {
          onSuccess: () => {
            toast.success('Subcategoria atualizada com sucesso!');
            navigate('/subtipos-despesa');
          },
          onError: (error) => {
            console.error('Erro ao atualizar subcategoria:', error);
            toast.error('Erro ao atualizar subcategoria');
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          data: {
            descricao: data.descricao,
            categoriaId: data.categoriaId,
            ativo: true,
          },
        },
        {
          onSuccess: () => {
            toast.success('Subcategoria criada com sucesso!');
            navigate('/subtipos-despesa');
          },
          onError: (error) => {
            console.error('Erro ao criar subcategoria:', error);
            toast.error('Erro ao criar subcategoria');
          },
        }
      );
    }
  };

  const isLoading = isLoadingSubCategoria || isLoadingCategorias;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Filtrar apenas categorias ativas
  const categoriasAtivas = categorias.filter(categoria => categoria.ativo);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (isEditing && errorSubCategoria) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-4">Erro ao carregar subcategoria</p>
            <Button onClick={() => navigate('/subtipos-despesa')}>
              Voltar para lista
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t('navigation.home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/subtipos-despesa">
                {t('administration.expenseSubtypes')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEditing ? t('expenseSubtypes.editSubcategory') : t('expenseSubtypes.newSubcategory')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? t('expenseSubtypes.editSubcategory') : t('expenseSubtypes.newSubcategory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Campo Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoriaId">{t('expenseSubtypes.category')} *</Label>
                {isEditing ? (
                  <div className="p-3 bg-muted rounded-md border">
                    <span className="text-sm font-medium">
                      {subCategoria?.categoria?.descricao || 'Carregando...'}
                    </span>
                  </div>
                ) : (
                  <Controller
                    name="categoriaId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? field.value.toString() : ''}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('expenseSubtypes.categoryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriasAtivas.map((categoria) => (
                            <SelectItem
                              key={categoria.idCategoria}
                              value={categoria.idCategoria!.toString()}
                            >
                              {categoria.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {errors.categoriaId && (
                  <p className="text-sm text-destructive">
                    {errors.categoriaId.message}
                  </p>
                )}
              </div>

              {/* Campo Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">{t('expenseSubtypes.description')} *</Label>
                <Input
                  id="descricao"
                  {...register('descricao')}
                  placeholder={t('expenseSubtypes.descriptionPlaceholder')}
                  disabled={isSaving}
                />
                {errors.descricao && (
                  <p className="text-sm text-destructive">
                    {errors.descricao.message}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/subtipos-despesa')}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isEditing ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FormularioSubCategoriaDespesas;