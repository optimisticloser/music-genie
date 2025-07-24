import React from 'react';
import { Sidebar } from './Sidebar';
import { MiniPlayer } from './MiniPlayer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 bg-white overflow-y-auto">
          {children}
        </main>
      </div>
      
      {/* Mini Player */}
      <MiniPlayer />
    </div>
  );
} 