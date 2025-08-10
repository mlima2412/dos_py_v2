import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoHome = () => {
    navigate('/inicio');
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="text-center">
          {/* Blackhole centralizado */}
          <img
            src="/blackhole.png"
            alt="Blackhole"
            className="h-64 w-auto mx-auto"
          />
        </div>
      </div>

      {/* Lado direito - Conteúdo */}
      <div className="flex-1 flex justify-start pl-16 bg-background">
        <div className="flex flex-col">
          <div className="mt-10 mb-36">
            <img
              src="/logo-central-color.png"
              alt="Logo Central"
              className="h-16 w-auto"
            />
          </div>
          <div className="max-w-md">
            {/* 404... - Grande, laranja */}
            <h1 className="text-8xl font-bold text-orange-500 mb-4">404...</h1>

            {/* Ops!!!! - Tamanho médio */}
            <h2 className="text-4xl font-semibold text-white mb-6">Ops!!!!</h2>

            {/* Descrição - Tamanho normal */}
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              A página que você solicitou não foi encontrada
            </p>

            {/* Botão para retornar à home */}
            <Button
              onClick={handleGoHome}
              size="lg"
              className="px-8 py-3 text-base flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              {t('common.home')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
