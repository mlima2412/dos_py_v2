import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Spinner } from '@/components/ui/spinner';
import { Save, X } from 'lucide-react';

import { useToast } from '@/hooks/useToast';
import {
  useCreateParceiro,
  useUpdateParceiro,
  useGetParceiro,
} from '@/hooks/useParceiroMutations';
import type { ResponseErrorConfig } from '@/lib/fetch-client';
import type {
  ParceirosControllerCreate400,
  ParceirosControllerCreate409,
  ParceirosControllerUpdate404,
  ParceirosControllerUpdate409,
} from '@/api-client';
// import type { ResponseErrorConfig } from '@/api-client';



// Schema unificado para ambos os casos
const parceiroSchema = (t: ReturnType<typeof useTranslation>['t']) =>
  z.object({
    nome: z
      .string()
      .min(1, t('validation.required', { field: t('partners.name') }))
      .min(2, t('validation.minLength', { field: t('partners.name'), min: 2 })),
    email: z
      .string()
      .min(1, t('validation.required', { field: t('partners.email') }))
      .email(t('validation.email')),
    ruccnpj: z
      .string()
      .min(1, t('validation.required', { field: t('partners.ruccnpj') })),
    telefone: z.string().optional(),
    redesocial: z.string().optional(),
  });

type ParceiroFormData = z.infer<ReturnType<typeof parceiroSchema>>;

export function FormularioParceiro() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { publicId } = useParams<{ publicId: string }>();
  const isEditing = Boolean(publicId);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ParceiroFormData>({
    resolver: zodResolver(parceiroSchema(t)),
    defaultValues: {
      nome: '',
      email: '',
      ruccnpj: '',
      telefone: '',
      redesocial: '',
    },
  });

  // Buscar dados do parceiro para edição
  const { data: parceiroData, isLoading: isLoadingParceiro } = useGetParceiro(
    publicId || '',
  );

  // Preencher formulário com dados do parceiro
  useEffect(() => {
    if (parceiroData && isEditing) {
      const formData = {
        nome: parceiroData.nome || '',
        email: parceiroData.email || '',
        ruccnpj: parceiroData.ruccnpj || '',
        telefone: parceiroData.telefone || '',
        redesocial: parceiroData.redesocial || '',
      };

      reset(formData);
    }
  }, [parceiroData, isEditing, reset]);

  // Mutations
  const createParceiroMutation = useCreateParceiro();
  const updateParceiroMutation = useUpdateParceiro();

  const onSubmit = (data: ParceiroFormData) => {
    if (isEditing && publicId) {
      const updateData = {
        nome: data.nome,
        email: data.email,
        ruccnpj: data.ruccnpj,
        telefone: data.telefone || undefined,
        redesocial: data.redesocial || undefined,
      };
      updateParceiroMutation.mutate(
        { publicId, data: updateData },
        {
          onSuccess: () => {
            toast.success(t('partners.messages.updateSuccess'));
            navigate('/parceiros');
          },
          onError: (error: ResponseErrorConfig<ParceirosControllerUpdate404 | ParceirosControllerUpdate409>) => {
            toast.error(error.statusText || t('partners.messages.updateError'));
          },
        },
      );
    } else {
      const createData = {
        nome: data.nome,
        email: data.email,
        ruccnpj: data.ruccnpj,
        telefone: data.telefone || undefined,
        redesocial: data.redesocial || undefined,
      };
      createParceiroMutation.mutate(
        { data: createData },
        {
          onSuccess: () => {
            toast.success(t('partners.messages.createSuccess'));
            navigate('/parceiros');
          },
          onError: (error: ResponseErrorConfig<ParceirosControllerCreate400 | ParceirosControllerCreate409>) => {
            toast.error(error.statusText || t('partners.messages.createError'));
          },
        },
      );
    }
  };

  const isLoading = isLoadingParceiro;
  const isSaving =
    createParceiroMutation.isPending || updateParceiroMutation.isPending;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
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
              <BreadcrumbLink href="/parceiros">
                {t('partners.title')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEditing ? t('partners.edit') : t('partners.create')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? t('partners.edit') : t('partners.create')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Primeira linha: Nome, Email, RUC/CNPJ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome">{t('partners.name')} *</Label>
                  <Input
                    id="nome"
                    {...register('nome')}
                    placeholder={t('partners.namePlaceholder')}
                    className={errors.nome ? 'border-destructive' : ''}
                  />
                  {errors.nome && (
                    <p className="text-sm text-destructive">
                      {errors.nome.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('partners.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder={t('partners.emailPlaceholder')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* RUC/CNPJ */}
                <div className="space-y-2">
                  <Label htmlFor="ruccnpj">{t('partners.ruccnpj')} *</Label>
                  <Input
                    id="ruccnpj"
                    {...register('ruccnpj')}
                    placeholder={t('partners.ruccnpjPlaceholder')}
                    className={errors.ruccnpj ? 'border-destructive' : ''}
                  />
                  {errors.ruccnpj && (
                    <p className="text-sm text-destructive">
                      {errors.ruccnpj.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Segunda linha: Telefone, Rede Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="telefone">{t('partners.phone')}</Label>
                  <Input
                    id="telefone"
                    {...register('telefone')}
                    placeholder={t('partners.phonePlaceholder')}
                  />
                </div>

                {/* Rede Social */}
                <div className="space-y-2">
                  <Label htmlFor="redesocial">
                    {t('partners.socialNetwork')}
                  </Label>
                  <Input
                    id="redesocial"
                    {...register('redesocial')}
                    placeholder={t('partners.socialNetworkPlaceholder')}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/parceiros')}
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
}
