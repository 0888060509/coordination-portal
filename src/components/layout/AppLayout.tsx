
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useUIContext } from '@/context/UIContext';
import Header from './Header';
import Sidebar from './Sidebar';

const AppLayout = () => {
  const { state: uiState } = useUIContext();
  const navigate = useNavigate();
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <main
        className={cn(
          "flex-1 flex flex-col transition-all duration-200 h-screen overflow-auto",
          uiState.sidebarOpen ? "ml-60" : "ml-[70px]"
        )}
      >
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <div className="flex-1 p-0 pt-16 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
