"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Music, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Playlist {
  id: string;
  title: string;
  description?: string;
  total_tracks: number;
  duration: string;
  gradient: string;
  created_at: string;
  spotify_playlist_id?: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/playlists/user?favorites=true&sortOrder=${sortOrder}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar favoritos');
      }

      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        await loadFavorites();
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [router, loadFavorites]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadFavorites}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            Favoritos
          </h1>
          <p className="text-gray-600">Suas playlists favoritas</p>
        </div>
        
        <Button
          variant="outline"
          onClick={toggleSortOrder}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}
        </Button>
      </div>

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum favorito ainda</h3>
          <p className="text-gray-600 mb-6">
            Marque suas playlists favoritas para vê-las aqui
          </p>
          <Button onClick={() => router.push('/dashboard/history')}>
            Ver todas as playlists
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <Card 
              key={playlist.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => router.push(`/dashboard/playlist/${playlist.id}`)}
            >
              <CardContent className="p-0">
                {/* Playlist Cover */}
                <div className={`h-48 bg-gradient-to-br ${playlist.gradient} rounded-t-lg relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Favorite Badge */}
                  <div className="absolute top-3 right-3">
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {playlist.title}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {playlist.total_tracks} músicas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {playlist.duration}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(playlist.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 