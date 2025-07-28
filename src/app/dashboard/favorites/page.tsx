"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Music, 
  Calendar, 
  Play, 
  MoreHorizontal
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { PlaylistFilters, PlaylistFiltersState } from "@/components/shared/PlaylistFilters";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";

interface Playlist {
  id: string;
  title: string;
  description?: string;
  gradient?: string;
  total_tracks: number;
  duration: string;
  created_at: string;
  spotify_playlist_id?: string;
  status: string;
  is_favorite?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [filters, setFilters] = useState<PlaylistFiltersState>({
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    viewMode: 'grid',
    favoritesOnly: true,
    genre: '',
    mood: '',
    energyLevel: '',
    instruments: [],
    themes: [],
    years: [],
    duration: '',
    timeRange: '',
  });
  const { toggleFavorite } = useFavoriteToggle();

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);
        await loadPlaylists(1);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [router]);

  // Load playlists when filters change
  useEffect(() => {
    if (user) {
      loadPlaylists(1);
    }
  }, [filters]);

  const loadPlaylists = async (page: number = pagination.page) => {
    try {
      setLoadingPlaylists(true);
      setPlaylistsError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('search', filters.search);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      params.append('favoritesOnly', filters.favoritesOnly.toString());
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.mood) params.append('mood', filters.mood);
      if (filters.energyLevel) params.append('energy_level', filters.energyLevel);
      if (filters.instruments && filters.instruments.length > 0) params.append('instruments', filters.instruments.join(','));
      if (filters.themes && filters.themes.length > 0) params.append('themes', filters.themes.join(','));
      if (filters.years && filters.years.length > 0) params.append('years', filters.years.join(','));
      if (filters.duration) params.append('duration', filters.duration);
      if (filters.timeRange) params.append('time_range', filters.timeRange);
      
      const response = await fetch(`/api/playlists/user?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load playlists');
      }
      
      const data = await response.json();
      setPlaylists(data.playlists || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setPlaylistsError('Failed to load playlists');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleToggleFavorite = async (playlistId: string, currentFavorite: boolean) => {
    const success = await toggleFavorite(playlistId, currentFavorite);
    if (success) {
      // Remove from local state since this is favorites page
      setPlaylists(prevPlaylists =>
        prevPlaylists.filter(playlist => playlist.id !== playlistId)
      );
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
        totalPages: Math.ceil((prev.total - 1) / prev.limit),
      }));
    }
  };

  const handleFiltersChange = (newFilters: PlaylistFiltersState) => {
    // Ensure favoritesOnly is always true
    setFilters({ ...newFilters, favoritesOnly: true });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Favoritos</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Suas playlists favoritas salvas para fácil acesso
          </p>
        </div>

        {/* Filters Component */}
        <div className="mb-6 md:mb-8">
          <PlaylistFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalResults={pagination.total}
            isLoading={loadingPlaylists}
          />
        </div>

        {/* Playlists Grid/List */}
        <div className="mb-8">
          {loadingPlaylists ? (
            <div className={`grid gap-6 ${
              filters.viewMode === 'grid' 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : playlistsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{playlistsError}</p>
              <Button onClick={() => loadPlaylists(1)}>Tentar novamente</Button>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma playlist favorita</h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.genre || filters.mood
                  ? "Tente ajustar os filtros para encontrar mais playlists."
                  : "Você ainda não tem playlists favoritas. Explore o histórico e marque suas favoritas!"}
              </p>
              {!filters.search && !filters.genre && !filters.mood && (
                <Button onClick={() => router.push("/dashboard/history")}>
                  Ver Histórico
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${
                filters.viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Playlist Cover */}
                      <div className="relative">
                        <div className={`aspect-square bg-gradient-to-br ${playlist.gradient || 'from-gray-400 to-gray-600'} rounded-t-lg flex items-center justify-center`}>
                          <div className="text-white text-center p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                              {playlist.title}
                            </h3>
                            {playlist.description && (
                              <p className="text-sm opacity-90 line-clamp-2">
                                {playlist.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <Button
                              size="sm"
                              className="bg-white text-gray-900 hover:bg-gray-100"
                              onClick={() => router.push(`/dashboard/playlist/${playlist.id}`)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white border-white text-gray-900 hover:bg-gray-100"
                              onClick={() => handleToggleFavorite(playlist.id, playlist.is_favorite || false)}
                            >
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Playlist Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                            {playlist.title}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {playlist.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {playlist.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              {playlist.total_tracks} faixas
                            </span>
                            <span>{playlist.duration}</span>
                          </div>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(playlist.created_at)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPlaylists(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPlaylists(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  );
} 