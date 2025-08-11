import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { type HoverAction } from '@/hooks/useStandardActions';

interface HoverActionsProps {
  actions: HoverAction[];
  className?: string;
}

export const HoverActions: React.FC<HoverActionsProps> = ({ actions, className }) => {
  return (
    <div className={cn(
      "flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out",
      className
    )}>
      {actions.map((action, index) => {
        const buttonContent = (
          <Button
            key={index}
            variant={action.variant || 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <span className="sr-only">{action.label}</span>
            {action.icon}
          </Button>
        );

        if (action.href) {
          return (
            <Link key={index} to={action.href}>
              {buttonContent}
            </Link>
          );
        }

        return buttonContent;
      })}
    </div>
  );
};