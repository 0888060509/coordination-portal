
import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useUIContext } from '@/context/UIContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const AppLayout = () => {
  const { state: uiState } = useUIContext();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-200 h-screen overflow-auto",
          uiState.sidebarOpen ? "ml-60" : "ml-[70px]"
        )}
      >
        <Header />
        <div className="pt-16 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
