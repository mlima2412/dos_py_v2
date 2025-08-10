import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detectar tamanho da tela e ajustar estado inicial
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true); // Aberto por padrão em desktop
      } else {
        setSidebarOpen(false); // Fechado por padrão em mobile
      }
    };

    // Configurar estado inicial
    handleResize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuToggle={toggleSidebar} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 transition-all duration-300 ease-in-out',
          // Em mobile: sempre sem margem (sidebar é overlay)
          // Em desktop: margem quando sidebar está aberto
          sidebarOpen ? 'md:ml-64' : 'md:ml-0',
          'min-h-[calc(100vh-4rem)]',
        )}
      >
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
};
