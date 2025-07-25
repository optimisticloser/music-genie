"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Sparkles, 
  Radio, 
  Clock, 
  Mic2, 
  Disc3, 
  Music, 
  Heart,
  ListMusic,
  Search,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onClose?: () => void;
}

const navigationItems = [
  { name: 'Início', href: '/dashboard', icon: Home },
  { name: 'Descobrir', href: '/dashboard/discover', icon: Sparkles },
  { name: 'Rádio', href: '/dashboard/radio', icon: Radio },
  { name: 'Gerar AI', href: '/dashboard/generate', icon: Sparkles, highlight: true },
];

const libraryItems = [
  { name: 'Adições recentes', href: '/dashboard/history', icon: Clock },
  { name: 'Favoritos', href: '/dashboard/favorites', icon: Heart },
];

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/dashboard/search');
    }
    onClose?.();
  };

  const handleSearchFocus = () => {
    if (pathname !== '/dashboard/search') {
      router.push('/dashboard/search');
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose?.();
  };

  return (
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:flex p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Music Genie</h1>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Music Genie</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </form>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Main Navigation */}
        <div className="space-y-1 mb-6">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  isActive 
                    ? "bg-red-100 text-red-700" 
                    : "text-gray-700 hover:bg-gray-100",
                  item.highlight && "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-red-600" : "text-gray-500",
                  item.highlight && "text-red-500"
                )} />
                {item.name}
                {item.highlight && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Biblioteca */}
        <div className="mb-6">
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Biblioteca
          </h3>
          <div className="space-y-1">
            {libraryItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    isActive 
                      ? "bg-red-100 text-red-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-red-600" : "text-gray-500"
                  )} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>


      </ScrollArea>
    </div>
  );
} 