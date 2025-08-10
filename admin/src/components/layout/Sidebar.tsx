import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMenuList } from './menu-list';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const menuList = getMenuList(location.pathname, t, user?.perfil);

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href],
    );
  };

  const handleLinkClick = () => {
    // Fechar sidebar em telas móveis quando um link é clicado
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para telas móveis */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform bg-background border-r border-border transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <ScrollArea className="h-full py-4">
          <nav className="space-y-2 px-3">
            {menuList.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                {/* Group Label */}
                {group.groupLabel && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.groupLabel}
                    </h3>
                  </div>
                )}

                {/* Menu Items */}
                {group.menus.map((menu, menuIndex) => (
                  <div key={menuIndex}>
                    {/* Main Menu Item */}
                    {menu.submenus.length > 0 ? (
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start h-10 px-3',
                          menu.active && 'bg-accent text-accent-foreground',
                        )}
                        onClick={() => toggleMenu(menu.href)}
                      >
                        <menu.icon className="mr-3 h-4 w-" />
                        <span className="flex-1 text-left text-sm">
                          {menu.label}
                        </span>
                        {expandedMenus.includes(menu.href) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start h-6 px-3',
                          menu.active && 'bg-accent text-accent-foreground',
                        )}
                        asChild
                      >
                        <Link to={menu.href} onClick={handleLinkClick}>
                          <menu.icon className="mr-3 h-4 w-4" />
                          <span className="text-sm">{menu.label}</span>
                        </Link>
                      </Button>
                    )}

                    {/* Submenus */}
                    {menu.submenus.length > 0 &&
                      expandedMenus.includes(menu.href) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {menu.submenus.map((submenu, submenuIndex) => (
                            <Button
                              key={submenuIndex}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'w-full justify-start h-8 px-3 text-xs',
                                submenu.active &&
                                  'bg-accent text-accent-foreground',
                              )}
                              asChild
                            >
                              <Link to={submenu.href} onClick={handleLinkClick}>
                                <span>{submenu.label}</span>
                              </Link>
                            </Button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}

                {/* Separator between groups */}
                {groupIndex < menuList.length - 1 && (
                  <div className="border-t border-border my-4" />
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
};
