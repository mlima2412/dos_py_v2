import React from 'react';
import { usePartnerContext } from '@/hooks/usePartnerContext';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Exemplo prático de como usar o hook do parceiro em uma lista de despesas
 * Demonstra como acessar informações do parceiro e formatar moedas
 */

// Tipo simulado para despesa (exemplo)
interface DespesaExemplo {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
}

// Dados de exemplo
const despesasExemplo: DespesaExemplo[] = [
  {
    id: '1',
    descricao: 'Aluguel do escritório',
    valor: 2500.00,
    data: '2024-01-15',
    categoria: 'Infraestrutura'
  },
  {
    id: '2',
    descricao: 'Material de escritório',
    valor: 150.75,
    data: '2024-01-10',
    categoria: 'Suprimentos'
  },
  {
    id: '3',
    descricao: 'Software de contabilidade',
    valor: 89.90,
    data: '2024-01-05',
    categoria: 'Software'
  }
];

export const ExemploListaDespesas: React.FC = () => {
  const {
    selectedPartnerId,
    selectedPartnerName,
    selectedPartnerLocale,
    selectedPartnerIsoCode,
    isLoading,
    hasPartners
  } = usePartnerContext();

  const { formatCurrency } = useCurrencyFormatter();

  if (isLoading) {
    return <div>Carregando informações do parceiro...</div>;
  }

  if (!hasPartners) {
    return <div>Nenhum parceiro disponível</div>;
  }

  if (!selectedPartnerId) {
    return <div>Nenhum parceiro selecionado</div>;
  }

  const totalDespesas = despesasExemplo.reduce((total, despesa) => total + despesa.valor, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações do parceiro */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas do Parceiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Parceiro:</label>
              <p className="text-lg font-semibold">{selectedPartnerName}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">ID:</label>
              <p className="text-sm text-gray-800">{selectedPartnerId}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Moeda:</label>
              <p className="text-sm">
                {selectedPartnerIsoCode ? (
                  <Badge variant="outline">{selectedPartnerIsoCode}</Badge>
                ) : (
                  <Badge variant="secondary">BRL (padrão)</Badge>
                )}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Locale:</label>
              <p className="text-sm">
                {selectedPartnerLocale ? (
                  <Badge variant="secondary">{selectedPartnerLocale}</Badge>
                ) : (
                  <Badge variant="secondary">pt-BR (padrão)</Badge>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold text-lg">{formatCurrency(totalDespesas)}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {despesasExemplo.map((despesa) => (
              <div
                key={despesa.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{despesa.descricao}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600">{despesa.data}</span>
                    <Badge variant="outline" className="text-xs">
                      {despesa.categoria}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {formatCurrency(despesa.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo com diferentes formatações */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Formatação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Valor pequeno:</span>
              <span className="font-mono">{formatCurrency(25.50)}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor médio:</span>
              <span className="font-mono">{formatCurrency(1234.56)}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor grande:</span>
              <span className="font-mono">{formatCurrency(98765.43)}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor zero:</span>
              <span className="font-mono">{formatCurrency(0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExemploListaDespesas;