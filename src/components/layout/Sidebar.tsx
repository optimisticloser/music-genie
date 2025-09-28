"use client";

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { stripLocaleFromPath } from '@/i18n/utils';
import { 
  Home, 
  Sparkles, 
  Radio, 
  Clock, 
  Music, 
  Heart,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/config';

interface SidebarProps {
  onClose?: () => void;
}

type NavItem = {
  key: 'home' | 'discover' | 'radio' | 'generate';
  href: '/dashboard' | '/dashboard/discover' | '/dashboard/radio' | '/dashboard/generate';
  icon: typeof Home;
  highlight?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/dashboard', icon: Home },
  { key: 'discover', href: '/dashboard/discover', icon: Sparkles },
  { key: 'radio', href: '/dashboard/radio', icon: Radio },
  { key: 'generate', href: '/dashboard/generate', icon: Sparkles, highlight: true },
];

const LIBRARY_ITEMS = [
  { key: 'history', href: '/dashboard/history', icon: Clock },
  { key: 'favorites', href: '/dashboard/favorites', icon: Heart },
] as const;

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const t = useTranslations('dashboard.sidebar');

  const normalizedPathname = useMemo(
    () => stripLocaleFromPath(pathname),
    [pathname]
  );

  const navigationItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        name: t(`nav.${item.key}`),
      })),
    [t]
  );

  const libraryItems = useMemo(
    () =>
      LIBRARY_ITEMS.map((item) => ({
        ...item,
        name: t(`library.${item.key}`),
      })),
    [t]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push({
        pathname: '/dashboard/search',
        query: { q: searchQuery.trim() },
      });
    } else {
      router.push('/dashboard/search');
    }
    onClose?.();
  };

  const handleSearchFocus = () => {
    if (normalizedPathname !== '/dashboard/search') {
      router.push('/dashboard/search');
    }
  };

  const handleNavigation = (
    href: NavItem['href'] | (typeof LIBRARY_ITEMS)[number]['href']
  ) => {
    router.push(href);
    onClose?.();
  };

  return (
    <div className="w-64 md:w-72 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:flex p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{siteConfig.name}</h1>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base font-semibold text-gray-900">{siteConfig.name}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1.5"
          aria-label={t('close')}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 md:p-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </form>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Main Navigation */}
        <div className="space-y-1 mb-4">
          {navigationItems.map((item) => {
            const isActive = normalizedPathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  isActive 
                    ? "bg-red-100 text-red-700" 
                    : "text-gray-700 hover:bg-gray-100",
                  item.highlight && "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4",
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

        <Separator className="my-3" />

        {/* Biblioteca */}
        <div className="mb-4">
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t('libraryTitle')}
          </h3>
          <div className="space-y-1">
            {libraryItems.map((item) => {
              const isActive = normalizedPathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    isActive 
                      ? "bg-red-100 text-red-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4",
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
