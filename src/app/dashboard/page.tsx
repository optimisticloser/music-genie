"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Sparkles,
  Music,
  Wrench,
  Loader2
} from "lucide-react";
import createClient, { SUPABASE_CONFIG_ERROR_MESSAGE } from "@/lib/supabase/client";
import LoadingPlaylistCard from '@/components/LoadingPlaylistCard';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { NewPlaylistsCounter } from '@/components/playlist/NewPlaylistsCounter';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';

interface Playlist {
  id: string;
  title: string;
  description?: string;
  gradient?: string;
  total_tracks: number;
  duration: string;
  created_at: string;
  spotify_playlist_id?: string;
  is_favorite?: boolean;
  status: 'published' | 'draft';
  viewed_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [connectingSpotify, setConnectingSpotify] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [fixingTrackCounts, setFixingTrackCounts] = useState(false);
  const { toggleFavorite } = useFavoriteToggle();

  const loadPlaylists = useCallback(async () => {
    try {
      if (configError) {
        return;
      }

      setLoadingPlaylists(true);
      setPlaylistsError(null);

      const response = await fetch("/api/playlists/user?limit=8");

      if (!response.ok) {
        throw new Error("Failed to load playlists");
      }

      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error("Error loading playlists:", error);
      setPlaylistsError("Failed to load playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  }, [configError]);

  useEffect(() => {
    async function getUser() {
      try {
        const supabase = createClient();

        if (!supabase) {
          if (!configError) {
            setConfigError(SUPABASE_CONFIG_ERROR_MESSAGE);
            setPlaylistsError(SUPABASE_CONFIG_ERROR_MESSAGE);
          }
          setLoadingPlaylists(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Check if user has Spotify connected
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('spotify_user_id')
            .eq('id', user.id)
            .single();
          
          setSpotifyConnected(!!userData?.spotify_user_id);
        }

        // Load user playlists
        await loadPlaylists();
      } catch (error) {
        console.error("Error fetching user:", error);
        if (!configError) {
          router.push("/login");
        }
      } finally {
        // setLoading(false); // Removed as per edit hint
      }
    }

    getUser();
  }, [router, configError, loadPlaylists]);

  const handleConnectSpotify = async () => {
    setConnectingSpotify(true);
    try {
      const response = await fetch('/api/auth/spotify');
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Spotify:', error);
    } finally {
      setConnectingSpotify(false);
    }
  };

  const handleFixTrackCounts = async () => {
    setFixingTrackCounts(true);
    try {
      const response = await fetch('/api/playlist/fix-track-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Track counts fixed:', result);
        
        // Reload playlists to show corrected counts
        await loadPlaylists();
        
        // Show success message
        alert(`✅ ${result.fixed_count} playlists corrigidas!`);
      } else {
        throw new Error('Failed to fix track counts');
      }
    } catch (error) {
      console.error('Error fixing track counts:', error);
      alert('❌ Erro ao corrigir contagens de músicas');
    } finally {
      setFixingTrackCounts(false);
    }
  };

  const handleToggleFavorite = async (playlistId: string, currentFavorite: boolean) => {
    const success = await toggleFavorite(playlistId, currentFavorite);
    if (success) {
      // Update local state
      setPlaylists(prevPlaylists =>
        prevPlaylists.map(playlist =>
          playlist.id === playlistId
            ? { ...playlist, is_favorite: !currentFavorite }
            : playlist
        )
      );
    }
  };

  if (configError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Configuração necessária</h1>
          <p className="text-gray-600">{SUPABASE_CONFIG_ERROR_MESSAGE}</p>
          <p className="text-sm text-gray-500">
            Adicione as variáveis do Supabase ao ambiente para visualizar suas playlists e dados do dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8 md:mb-10 lg:mb-12">
          <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-12 text-center border border-red-100">
            <div className="max-w-3xl mx-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl md:rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 lg:mb-8">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 lg:mb-6">
                Crie sua playlist perfeita
              </h1>
              
              <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 lg:mb-10 leading-relaxed max-w-2xl mx-auto">
                Descreva o que você quer ouvir e nossa IA criará uma playlist personalizada 
                com as melhores músicas para o momento.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 lg:px-10 py-3 md:py-4 text-base md:text-lg lg:text-xl font-semibold rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  onClick={() => router.push("/dashboard/generate")}
                >
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  Gerar com IA
                </Button>
                
                {!spotifyConnected && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 px-6 md:px-8 lg:px-10 py-3 md:py-4 text-base md:text-lg lg:text-xl font-semibold rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    onClick={handleConnectSpotify}
                    disabled={connectingSpotify}
                  >
                    <Music className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                    {connectingSpotify ? 'Conectando...' : 'Conectar Spotify'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Back */}
        <div className="mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
            Bem-vindo de volta, {user.email}
          </h2>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg">
            Suas playlists criadas e descobertas musicais
          </p>
          
          {spotifyConnected && (
            <div className="mt-4 md:mt-6 p-4 md:p-5 lg:p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-green-600" />
                <span className="text-green-800 font-medium text-sm md:text-base lg:text-lg">
                  Spotify conectado! Você pode salvar playlists diretamente na sua conta.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Playlists Grid */}
        <div className="mb-8 md:mb-10 lg:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">Playlists</h3>
              <NewPlaylistsCounter />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleFixTrackCounts}
                disabled={fixingTrackCounts}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-600 hover:bg-orange-50 text-sm md:text-base"
              >
                {fixingTrackCounts ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
                    Corrigir Contagens
                  </>
                )}
              </Button>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/playlist/test-generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                    if (response.ok) {
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Test generation error:', error);
                  }
                }}
                className="text-sm md:text-base bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Testar Geração
              </button>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/playlist/update-all-previews', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    if (response.ok) {
                      const data = await response.json();
                      alert(`✅ ${data.message}`);
                      window.location.reload();
                    } else {
                      const error = await response.json();
                      alert(`❌ Erro: ${error.error}`);
                    }
                  } catch (error) {
                    console.error('Update previews error:', error);
                    alert('❌ Erro ao atualizar preview URLs');
                  }
                }}
                className="text-sm md:text-base bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Atualizar Previews
              </button>
              <Button variant="ghost" size="sm" className="text-gray-500 text-sm md:text-base">
                Ver todas
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 lg:gap-8">
            {loadingPlaylists ? (
              // Loading state
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <div className="p-3 md:p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : playlistsError ? (
              // Error state
              <div className="col-span-full text-center py-8 md:py-12">
                <div className="text-red-500 mb-4 text-base md:text-lg">Erro ao carregar playlists</div>
                <Button onClick={loadPlaylists} variant="outline" size="lg">
                  Tentar novamente
                </Button>
              </div>
            ) : playlists.length === 0 ? (
              // Empty state
              <div className="col-span-full text-center py-12 md:py-16">
                <Music className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4 md:mb-6" />
                <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2 md:mb-3">
                  Nenhuma playlist ainda
                </h3>
                <p className="text-gray-600 mb-4 md:mb-6 text-base md:text-lg">
                  Crie sua primeira playlist com IA!
                </p>
                <Button onClick={() => router.push("/dashboard/generate")} size="lg" className="text-base md:text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Playlist
                </Button>
              </div>
            ) : (
              playlists.map((playlist: Playlist) => (
                playlist.status !== 'published' ? (
                  <LoadingPlaylistCard key={playlist.id} />
                ) : (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    variant="compact"
                    onPlay={(playlistId) => {
                      console.log("Play playlist:", playlistId);
                    }}
                    onToggleFavorite={(playlistId, isFavorite) => {
                      handleToggleFavorite(playlistId, isFavorite);
                    }}
                  />
                )
              ))
            )}
          </div>
        </div>

        {/* Recently Played */}
        <div className="mb-8 md:mb-10 lg:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">Tocadas recentemente</h3>
            <Button variant="ghost" size="sm" className="text-gray-500 text-sm md:text-base">
              Ver todas
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {loadingPlaylists ? (
              // Loading state for recent playlists
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : playlists.length === 0 ? (
              <div className="col-span-full text-center py-8 md:py-12">
                <p className="text-gray-500 text-base md:text-lg">Nenhuma playlist recente</p>
              </div>
            ) : (
              playlists.slice(0, 4).map((playlist: Playlist) => (
                <Link key={`recent-${playlist.id}`} href={`/dashboard/playlist/${playlist.id}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${playlist.gradient || 'from-purple-500 to-blue-500'} rounded-lg flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-2 truncate text-base md:text-lg">
                            {playlist.title}
                          </h4>
                          <p className="text-sm md:text-base text-gray-500 truncate">
                            Music Genie AI
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
} 