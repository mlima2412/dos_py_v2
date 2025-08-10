import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.welcome', { name: user?.nome })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.users')}</CardTitle>
              <CardDescription>{t('dashboard.totalUsers')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.sales')}</CardTitle>
              <CardDescription>{t('dashboard.monthlySales')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 45,231</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.orders')}</CardTitle>
              <CardDescription>{t('dashboard.pendingOrders')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas ações no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Novo usuário cadastrado</span>
                  <span className="text-xs text-muted-foreground">2 min atrás</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pedido #1234 finalizado</span>
                  <span className="text-xs text-muted-foreground">5 min atrás</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Produto atualizado</span>
                  <span className="text-xs text-muted-foreground">10 min atrás</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>Informações gerais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Servidor</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Banco de Dados</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Conectado</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Última Atualização</span>
                  <span className="text-xs text-muted-foreground">Hoje às 14:30</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};