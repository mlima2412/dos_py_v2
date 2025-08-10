import { createContext } from 'react';

interface PartnerContextType {
  selectedPartnerId: string | null;
  selectedPartnerName: string;
  setSelectedPartner: (partnerId: string | null, partnerName: string) => void;
  clearSelectedPartner: () => void;
}

export const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export type { PartnerContextType };