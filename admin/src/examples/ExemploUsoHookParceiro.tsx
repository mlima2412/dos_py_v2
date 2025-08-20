import React from 'react';
import { usePartnerContext } from '@/hooks/usePartnerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Exemplo de como usar o hook do parceiro em um componente
 * Este exemplo mostra como acessar todas as informações do parceiro selecionado,
 * incluindo locale e isoCode da moeda
 */
export const ExemploUsoHookParceiro: React.FC = () => {
  const {
    // Estados básicos do parceiro
    selectedPartnerId,
    selectedPartnerName,
    selectedPartnerLocale,
    selectedPartnerIsoCode,
    
    // Lista de parceiros e estados de carregamento
    parceiros,
    isLoading,
    error,
    hasPartners,
    
    // Dados completos do parceiro selecionado
    selectedPartnerData,
    
    // Funções de controle
    clearSelectedPartner,
    switchToPartner,
    
    // Funções utilitárias
    isPartnerSelected,
  } = usePartnerContext();

  // Exemplo de formatação de moeda usando locale e isoCode
  const formatCurrency = (value: number) => {
    if (!selectedPartnerLocale || !selectedPartnerIsoCode) {
      return `R$ ${value.toFixed(2)}`; // Fallback para Real brasileiro
    }
    
    try {
      return new Intl.NumberFormat(selectedPartnerLocale, {
        style: 'currency',
        currency: selectedPartnerIsoCode,
      }).format(value);
    } catch (error) {
      console.warn('Erro ao formatar moeda:', error);
      return `${selectedPartnerIsoCode} ${value.toFixed(2)}`;
    }
  };

  // Exemplo de troca de parceiro
  const handleSwitchPartner = (partnerId: string) => {
    const success = switchToPartner(partnerId);
    if (success) {
      console.log(`Parceiro trocado para: ${partnerId}`);
    } else {
      console.error('Falha ao trocar parceiro');
    }
  };

  if (isLoading) {
    return <div>Carregando informações do parceiro...</div>;
  }

  if (error) {
    return <div>Erro ao carregar parceiros</div>;
  }

  if (!hasPartners) {
    return <div>Nenhum parceiro disponível</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Parceiro Selecionado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">ID:</label>
              <p className="text-lg">{selectedPartnerId || 'Não selecionado'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Nome:</label>
              <p className="text-lg">{selectedPartnerName || 'Não selecionado'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Locale da Moeda:</label>
              <p className="text-lg">
                {selectedPartnerLocale ? (
                  <Badge variant="secondary">{selectedPartnerLocale}</Badge>
                ) : (
                  'Não disponível'
                )}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Código ISO da Moeda:</label>
              <p className="text-lg">
                {selectedPartnerIsoCode ? (
                  <Badge variant="outline">{selectedPartnerIsoCode}</Badge>
                ) : (
                  'Não disponível'
                )}
              </p>
            </div>
          </div>
          
          {/* Exemplo de formatação de moeda */}
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600">Exemplo de Formatação:</label>
            <div className="space-y-2 mt-2">
              <p>Valor: 1234.56 → {formatCurrency(1234.56)}</p>
              <p>Valor: 999.99 → {formatCurrency(999.99)}</p>
              <p>Valor: 50.00 → {formatCurrency(50.00)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de todos os parceiros disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Parceiros Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {parceiros?.map((parceiro) => {
              const partnerId = parceiro.parceiroId?.toString();
              const isSelected = isPartnerSelected(partnerId || '');
              
              return (
                <div
                  key={partnerId}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-medium">{parceiro.Parceiro?.nome}</p>
                    <p className="text-sm text-gray-600">ID: {partnerId}</p>
                    {parceiro.Parceiro?.publicId && (
                      <p className="text-xs text-gray-500">
                        Public ID: {parceiro.Parceiro.publicId}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <Badge variant="default">Selecionado</Badge>
                    )}
                    
                    {!isSelected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSwitchPartner(partnerId || '')}
                      >
                        Selecionar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Botão para limpar seleção */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearSelectedPartner}
            >
              Limpar Seleção de Parceiro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados completos do parceiro (para debug) */}
      {selectedPartnerData && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Completos do Parceiro (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(selectedPartnerData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExemploUsoHookParceiro;