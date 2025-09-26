"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Music, Plus, Search, Loader2, Star, Clock } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeId = useMemo(() => {
    const match = pathname?.match(/\/dashboard\/playlist\/([^/?#]+)/);
    return match?.[1] || null;
  }, [pathname]);

  const fetchPage = useCallback(async (nextPage: number, q: string) => {
    if (loading || (!hasNext && nextPage !== 1)) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '20', sortBy: 'created_at', sortOrder: 'desc' });
      if (q.trim()) params.set('search', q.trim());
      const res = await fetch(`/api/playlists/user?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const newItems: PlaylistListItem[] = (data.playlists || []).map((p: any) => ({
        id: p.id,
        title: p.title || 'Sem título',
        status: p.status,
        total_tracks: p.total_tracks,
        viewed_at: p.viewed_at,
        created_at: p.created_at,
        is_favorite: p.is_favorite,
      }));
      setItems(prev => nextPage === 1 ? newItems : [...prev, ...newItems]);
      setHasNext(Boolean(data.pagination?.hasNextPage));
      setPage(nextPage);
    } catch (e) {
      console.error('Sidebar playlists load error', e);
    } finally {
      setLoading(false);
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
    if (!el || loading || !hasNext) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (nearBottom) fetchPage(page + 1, query);
  };

  return (
    <div className="w-64 md:w-72 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="hidden md:flex p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{siteConfig.name}</h1>
        </div>
      </div>

      <div className="p-3 md:p-4 flex gap-2">
        <button
          onClick={() => router.push('/dashboard/new')}
          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Nova playlist
        </button>
      </div>

      <div className="px-3 md:px-4 pb-3">
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

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1 pb-4">
          {items.map(item => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { router.push(`/dashboard/playlist/${item.id}`); onClose?.(); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
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
              </button>
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
    </div>
  );
}


