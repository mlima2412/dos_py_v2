import React from 'react';
import { Edit, Power, PowerOff } from 'lucide-react';

interface HoverAction {
  type: 'edit' | 'toggle' | 'custom';
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
}

// Hook para criar ações padrão de editar e ativar/desativar
export const useStandardActions = ({
  editHref,
  isActive,
  onToggle,
  editLabel = 'Editar',
  activateLabel = 'Ativar',
  deactivateLabel = 'Desativar',
}: {
  editHref: string;
  isActive: boolean;
  onToggle: () => void;
  editLabel?: string;
  activateLabel?: string;
  deactivateLabel?: string;
}): HoverAction[] => {
  return [
    {
      type: 'edit',
      label: editLabel,
      icon: <Edit className="h-4 w-4" />,
      href: editHref,
    },
    {
      type: 'toggle',
      label: isActive ? deactivateLabel : activateLabel,
      icon: isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />,
      onClick: onToggle,
      variant: isActive ? 'destructive' : 'default',
    },
  ];
};

export type { HoverAction };