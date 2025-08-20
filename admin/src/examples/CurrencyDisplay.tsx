import React from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

/**
 * Componente simples que demonstra como usar locale e isoCode do parceiro
 * para formatação de moeda em qualquer lugar da aplicação
 */
interface CurrencyDisplayProps {
  value: number;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  value, 
  className = '' 
}) => {
  const { formatCurrency } = useCurrencyFormatter();

  return (
    <span className={className}>
      {formatCurrency(value)}
    </span>
  );
};

export default CurrencyDisplay;