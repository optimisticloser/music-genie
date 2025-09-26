"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Music,
  Plus,
  Search,
  Loader2,
  Star,
  Clock,
  LogOut,
  Settings,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import createClient from '@/lib/supabase/client';
import { siteConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

interface PlaylistListItem {
  id: string;
  title: string;
  status?: string | null;
  total_tracks?: number | null;
  viewed_at?: string | null;
  created_at?: string | null;
  is_favorite?: boolean | null;
}

type ApiPlaylist = {
  id: string;
  title?: string | null;
  status?: string | null;
  total_tracks?: number | null;
  viewed_at?: string | null;
  created_at?: string | null;
  is_favorite?: boolean | null;
};

interface PlaylistsSidebarProps {
  onClose?: () => void;
}

export function PlaylistsSidebar({ onClose }: PlaylistsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<PlaylistListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);
  const supabase = createClient();

  const activeId = useMemo(() => {
    const match = pathname?.match(/\/dashboard\/playlist\/([^/?#]+)/);
    return match?.[1] || null;
  }, [pathname]);

  const accountName = useMemo(() => {
    if (!user) return 'Minha conta';
    return (
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split('@')[0] ||
      'Minha conta'
    );
  }, [user]);

  const accountInitials = useMemo(() => {
    return accountName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join('')
      .padEnd(2, '•');
  }, [accountName]);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (isMounted) {
          setUser(data.user ?? null);
        }
      })
      .catch((error) => {
        console.error('Failed to load user profile', error);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchPage = useCallback(async (nextPage: number, q: string) => {
    if (loading || (!hasNext && nextPage !== 1)) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '20', sortBy: 'created_at', sortOrder: 'desc' });
      if (q.trim()) params.set('search', q.trim());
      const res = await fetch(`/api/playlists/user?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const newItems: PlaylistListItem[] = (data.playlists as ApiPlaylist[] | undefined || []).map((p: ApiPlaylist) => ({
        id: p.id,
        title: p.title || 'Sem título',
        status: p.status,
        total_tracks: p.total_tracks,
        viewed_at: p.viewed_at,
        created_at: p.created_at,
        is_favorite: p.is_favorite,
      }));
      setItems(prev => {
        if (nextPage === 1) return newItems;
        const merged = new Map<string, PlaylistListItem>();
        [...prev, ...newItems].forEach(it => merged.set(it.id, it));
        return Array.from(merged.values());
      });
      setHasNext(Boolean(data.pagination?.hasNextPage));
      setPage(nextPage);
    } catch (e) {
      console.error('Sidebar playlists load error', e);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [loading, hasNext]);

  useEffect(() => {
    const t = setTimeout(() => {
      setTyping(false);
      fetchPage(1, query);
    }, 300);
    return () => clearTimeout(t);
  }, [query, fetchPage]);

  useEffect(() => {
    fetchPage(1, '');
  }, [fetchPage]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || loading || fetchingRef.current || !hasNext) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (nearBottom) {
      fetchingRef.current = true;
      fetchPage(page + 1, query);
    }
  };

  const goToSettings = () => {
    router.push('/dashboard/settings');
    onClose?.();
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      onClose?.();
      router.replace('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className="w-64 md:w-72 h-full bg-gray-50 border-r border-gray-200 flex flex-col touch-pan-y will-change-transform"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="hidden md:flex p-4 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{siteConfig.name}</h1>
        </div>
      </div>

      <div className="p-3 md:p-4 md:sticky md:top-14 bg-gray-50 z-10 border-b border-gray-200">
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push('/dashboard/new')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/dashboard/new'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-red-600" /> Nova playlist
        </div>
      </div>

      <div className="px-3 md:px-4 pb-3 md:sticky md:top-[84px] bg-gray-50 z-10 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar playlists"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setTyping(true); }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-2 overscroll-contain">
        <div className="space-y-1 pb-4">
          {items.map(item => {
            const active = activeId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => { router.push(`/dashboard/playlist/${item.id}`); onClose?.(); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { router.push(`/dashboard/playlist/${item.id}`); onClose?.(); } }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left cursor-pointer',
                  active ? 'bg-red-100 text-red-700' : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{item.title}</span>
                    {item.is_favorite ? <Star className="w-3.5 h-3.5 text-yellow-500" /> : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.total_tracks ? <span>{item.total_tracks} faixas</span> : null}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.viewed_at ? 'visto' : 'novo'}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-center py-4 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2" />Carregando…</div>
          )}
          {!loading && items.length === 0 && !typing && (
            <div className="text-center text-gray-500 text-sm py-8">Nenhuma playlist encontrada</div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-semibold flex items-center justify-center text-sm">
            {accountInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{accountName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || 'Conta não autenticada'}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={goToSettings}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname?.startsWith('/dashboard/settings')
                ? 'bg-red-100 text-red-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}


