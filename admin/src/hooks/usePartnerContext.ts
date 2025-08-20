import { usePartner } from '@/hooks/usePartner';
import { useUserParceiros } from './useUserParceiros';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import type { AuthControllerGetUserParceiros200 } from '@/api-client';

type ParceiroItem = AuthControllerGetUserParceiros200[0];

/**
 * Hook personalizado para gerenciar o contexto do parceiro selecionado
 * Fornece funcionalidades avançadas como sincronização automática e validação
 */
export function usePartnerContext() {
  const { isAuthenticated } = useAuth();
  const { parceiros, isLoading, error } = useUserParceiros();
  const {
    selectedPartnerId,
    selectedPartnerName,
    selectedPartnerLocale,
    selectedPartnerIsoCode,
    setSelectedPartner,
    clearSelectedPartner,
  } = usePartner();

  // Validar se o parceiro selecionado ainda existe na lista
  useEffect(() => {
    if (!isAuthenticated || isLoading || !parceiros || !selectedPartnerId) return;

    const partnerExists = parceiros.some(
      (p: ParceiroItem) => p.parceiroId?.toString() === selectedPartnerId
    );

    // Se o parceiro selecionado não existe mais, selecionar o primeiro disponível
    if (!partnerExists && parceiros.length > 0) {
      const firstPartner = parceiros[0];
      if (firstPartner?.parceiroId && firstPartner?.Parceiro?.nome) {
        setSelectedPartner(
          firstPartner.parceiroId.toString(),
          firstPartner.Parceiro.nome
        );
      }
    }
  }, [isAuthenticated, parceiros, isLoading, selectedPartnerId, setSelectedPartner]);

  // Função para obter dados do parceiro selecionado
  const getSelectedPartnerData = () => {
    if (!selectedPartnerId || !parceiros) return null;
    
    return parceiros.find(
      (p: ParceiroItem) => p.parceiroId?.toString() === selectedPartnerId
    );
  };

  // Função para verificar se um parceiro específico está selecionado
  const isPartnerSelected = (partnerId: string | number) => {
    return selectedPartnerId === partnerId.toString();
  };

  // Função para alternar entre parceiros
  const switchToPartner = (partnerId: string | number) => {
    if (!parceiros) return false;
    
    const partner = parceiros.find(
      (p: ParceiroItem) => p.parceiroId?.toString() === partnerId.toString()
    );
    
    if (partner?.parceiroId && partner?.Parceiro?.nome) {
      setSelectedPartner(
        partner.parceiroId.toString(),
        partner.Parceiro.nome
      );
      return true;
    }
    
    return false;
  };

  return {
    // Estados básicos
    selectedPartnerId,
    selectedPartnerName,
    selectedPartnerLocale,
    selectedPartnerIsoCode,
    parceiros,
    isLoading,
    error,
    isAuthenticated,
    
    // Funções de controle
    setSelectedPartner,
    clearSelectedPartner,
    switchToPartner,
    
    // Funções utilitárias
    getSelectedPartnerData,
    isPartnerSelected,
    
    // Estados derivados
    hasPartners: parceiros && parceiros.length > 0,
    selectedPartnerData: getSelectedPartnerData(),
    selectedPartnerCurrencyId: undefined, // currencyId não está disponível na resposta de AuthControllerGetUserParceiros
  };
}

export default usePartnerContext;