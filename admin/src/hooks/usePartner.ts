import { useContext } from 'react';
import { PartnerContext } from '@/contexts/PartnerContextType';

// Hook para usar o contexto de parceiro
export function usePartner() {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
}

export default usePartner;