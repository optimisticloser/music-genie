"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlaylistsSidebar } from '@/components/playlist/PlaylistsSidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { siteConfig } from '@/lib/config';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('dashboard.layout');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-1.5"
            aria-label={sidebarOpen ? t('closeMenu') : t('openMenu')}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">MG</span>
            </div>
            <h1 className="text-base font-semibold text-gray-900">{siteConfig.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed md:sticky md:top-0 inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:z-30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <PlaylistsSidebar onClose={closeSidebar} />
        </div>
        
        {/* Main Content */}
        <main className={`flex-1 bg-white overflow-y-auto w-full transform transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-64 md:translate-x-0' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
} 
