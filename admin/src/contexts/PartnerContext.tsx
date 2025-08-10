import React, { useState, useEffect, ReactNode } from 'react';
import { useUserParceiros } from '@/hooks/useUserParceiros';
import { useAuth } from '@/hooks/useAuth';
import type { AuthControllerGetUserParceiros200 } from '@/api-client';
import { PartnerContext, type PartnerContextType } from './PartnerContextType';

type ParceiroItem = AuthControllerGetUserParceiros200[0];

interface PartnerProviderProps {
  children: ReactNode;
}

export const PartnerProvider: React.FC<PartnerProviderProps> = ({ children }) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>('');
  const { isAuthenticated, updateSelectedPartner } = useAuth();
  const { parceiros, isLoading } = useUserParceiros();

  // Limpar dados do parceiro quando usuário faz logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedPartnerId(null);
      setSelectedPartnerName('');
      localStorage.removeItem('selectedPartnerId');
      localStorage.removeItem('selectedPartnerName');
      if (updateSelectedPartner) {
        updateSelectedPartner(null);
      }
      return;
    }
  }, [isAuthenticated, updateSelectedPartner]);

  // Carregar do localStorage na inicialização e selecionar primeiro parceiro se necessário
  useEffect(() => {
    if (!isAuthenticated || isLoading || !parceiros) return;

    const savedPartnerId = localStorage.getItem('selectedPartnerId');
    const savedPartnerName = localStorage.getItem('selectedPartnerName');
    
    // Verificar se o parceiro salvo ainda existe na lista
    const savedPartnerExists = savedPartnerId && savedPartnerId !== 'null' && 
      parceiros.some((p: ParceiroItem) => p.parceiroId?.toString() === savedPartnerId);
    
    if (savedPartnerExists && savedPartnerName) {
      setSelectedPartnerId(savedPartnerId);
      setSelectedPartnerName(savedPartnerName);
      
      // Atualizar contexto de autenticação com parceiro salvo
      const savedPartnerData = parceiros.find((p: ParceiroItem) => p.parceiroId?.toString() === savedPartnerId);
      if (savedPartnerData && updateSelectedPartner) {
        updateSelectedPartner(savedPartnerData);
      }
    } else if (parceiros.length > 1) {
      // Selecionar o primeiro parceiro automaticamente APENAS se:
      // 1. Não há parceiro salvo válido
      // 2. Há MÚLTIPLOS parceiros disponíveis (mais de 1)
      const firstPartner = parceiros[0];
      if (firstPartner?.parceiroId && firstPartner?.Parceiro?.nome) {
        const partnerId = firstPartner.parceiroId.toString();
        const partnerName = firstPartner.Parceiro.nome;
        
        setSelectedPartnerId(partnerId);
        setSelectedPartnerName(partnerName);
        
        // Salvar no localStorage
        localStorage.setItem('selectedPartnerId', partnerId);
        localStorage.setItem('selectedPartnerName', partnerName);
        
        // Atualizar contexto de autenticação com primeiro parceiro
        if (updateSelectedPartner) {
          updateSelectedPartner(firstPartner);
        }
      }
    } else if (parceiros.length === 1) {
      // Para usuários com apenas um parceiro, não selecionar automaticamente
      // O PartnerSelector irá exibir apenas o nome como texto simples
      const singlePartner = parceiros[0];
      if (singlePartner?.parceiroId && singlePartner?.Parceiro?.nome && updateSelectedPartner) {
        updateSelectedPartner(singlePartner);
      }
    }
  }, [isAuthenticated, parceiros, isLoading, updateSelectedPartner]);

  const setSelectedPartner = (partnerId: string | null, partnerName: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedPartnerName(partnerName);
    
    // Salvar no localStorage
    localStorage.setItem('selectedPartnerId', partnerId || 'null');
    localStorage.setItem('selectedPartnerName', partnerName);
    
    // Atualizar dados do parceiro no contexto de autenticação
       if (partnerId && parceiros) {
         const partnerData = parceiros.find((p: ParceiroItem) => p.parceiroId?.toString() === partnerId);
         if (partnerData && updateSelectedPartner) {
           updateSelectedPartner(partnerData);
         }
       } else if (updateSelectedPartner) {
         updateSelectedPartner(null);
       }
  };

  const clearSelectedPartner = () => {
    setSelectedPartnerId(null);
    setSelectedPartnerName('');
    
    // Limpar do localStorage
    localStorage.removeItem('selectedPartnerId');
    localStorage.removeItem('selectedPartnerName');
    
    // Se ainda há parceiros disponíveis, selecionar o primeiro
    if (parceiros && parceiros.length > 0) {
      const firstPartner = parceiros[0];
      if (firstPartner?.parceiroId && firstPartner?.Parceiro?.nome) {
        const partnerId = firstPartner.parceiroId.toString();
        const partnerName = firstPartner.Parceiro.nome;
        
        setSelectedPartnerId(partnerId);
        setSelectedPartnerName(partnerName);
        
        // Salvar no localStorage
        localStorage.setItem('selectedPartnerId', partnerId);
        localStorage.setItem('selectedPartnerName', partnerName);
      }
    }
  };

  const value: PartnerContextType = {
    selectedPartnerId,
    selectedPartnerName,
    setSelectedPartner,
    clearSelectedPartner,
  };

  return (
    <PartnerContext.Provider value={value}>
      {children}
    </PartnerContext.Provider>
  );
};