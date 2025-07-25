"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { 
  Search, 
  Music,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Heart
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Playlist {
  id: string;
  title: string;
  description?: string;
  gradient: string;
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

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [togglingFavorites, setTogglingFavorites] = useState<Set<string>>(new Set());

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
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPlaylists = useCallback(async (page: number = pagination.page) => {
    try {
      setLoadingPlaylists(true);
      setPlaylistsError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        status: statusFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      
      const response = await fetch(`/api/playlists/user?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load playlists');
      }
      
      const data = await response.json();
      setPlaylists(data.playlists || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setPlaylistsError('Failed to load playlists');
    } finally {
      setLoadingPlaylists(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleSearch = () => {
    loadPlaylists(1);
  };

  const handleFilterChange = (newStatusFilter: string) => {
    setStatusFilter(newStatusFilter);
    setTimeout(() => loadPlaylists(1), 100);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string = sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setTimeout(() => loadPlaylists(1), 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleToggleFavorite = async (playlistId: string, currentFavorite: boolean) => {
    if (togglingFavorites.has(playlistId)) return;

    try {
      setTogglingFavorites(prev => new Set(prev).add(playlistId));
      const newFavoriteStatus = !currentFavorite;

      const response = await fetch(`/api/playlists/${playlistId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: newFavoriteStatus }),
      });

      if (response.ok) {
        // Update the playlist in the local state
        setPlaylists(prev => prev.map(playlist => 
          playlist.id === playlistId 
            ? { ...playlist, is_favorite: newFavoriteStatus }
            : playlist
        ));
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setTogglingFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(playlistId);
        return newSet;
      });
    }
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

  if (!user) {
    return null;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Histórico</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Todas as suas playlists criadas com IA
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-4 mb-4 md:mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Input
                placeholder="Buscar playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Button 
                onClick={handleSearch}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Buscar
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("draft")}
                >
                  Rascunho
                </Button>
                <Button
                  variant={statusFilter === "published" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("published")}
                >
                  Publicadas
                </Button>
              </div>

              {/* Sort */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={sortBy === "created_at" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange("created_at", sortOrder === "desc" ? "asc" : "desc")}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Data {sortBy === "created_at" && (sortOrder === "desc" ? "↓" : "↑")}
                </Button>
                <Button
                  variant={sortBy === "title" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange("title", sortOrder === "desc" ? "asc" : "desc")}
                >
                  Nome {sortBy === "title" && (sortOrder === "desc" ? "↓" : "↑")}
                </Button>
              </div>
            </div>
          </div>

          {/* Results info */}
          <div className="text-sm text-gray-500">
            {loadingPlaylists ? (
              "Carregando..."
            ) : (
              `${pagination.total} playlists encontradas`
            )}
          </div>
        </div>

        {/* Playlists Grid */}
        <div className="mb-8">
          {loadingPlaylists ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">Erro ao carregar playlists</div>
              <Button onClick={() => loadPlaylists()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchQuery ? "Nenhuma playlist encontrada" : "Nenhuma playlist ainda"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? "Tente buscar com outros termos"
                  : "Crie sua primeira playlist com IA!"
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/dashboard/generate")}>
                  Gerar Playlist
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
              {playlists.map((playlist) => (
                <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all">
                    <CardContent className="p-0">
                      {/* Playlist Artwork */}
                      <div className={`aspect-square bg-gradient-to-br ${playlist.gradient} rounded-t-lg relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Button 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-10 h-10 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log("Play playlist:", playlist.id);
                            }}
                          >
                            <Play className="w-4 h-4 ml-0.5" />
                          </Button>
                        </div>
                        
                        {/* Status badge */}
                        <div className="absolute top-2 left-2">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            playlist.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {playlist.status === 'published' ? 'Publicada' : 'Rascunho'}
                          </div>
                        </div>
                        
                        {/* Favorite badge */}
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-white/20 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavorite(playlist.id, playlist.is_favorite || false);
                            }}
                            disabled={togglingFavorites.has(playlist.id)}
                          >
                            <Heart 
                              className={`w-4 h-4 transition-colors ${
                                playlist.is_favorite 
                                  ? 'text-red-500 fill-current' 
                                  : 'text-white/70 hover:text-red-400'
                              }`} 
                            />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Playlist Info */}
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">
                          {playlist.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{playlist.total_tracks} músicas • {playlist.duration}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(playlist.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => loadPlaylists(pagination.page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => loadPlaylists(pagination.page + 1)}
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
} 