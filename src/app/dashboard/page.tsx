"use client";

import { useEffect, useState } from "react";
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
import { supabase } from "@/lib/supabase/client";
import LoadingPlaylistCard from '@/components/LoadingPlaylistCard';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { NewPlaylistsCounter } from '@/components/playlist/NewPlaylistsCounter';

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
  const [loading, setLoading] = useState(true);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [connectingSpotify, setConnectingSpotify] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [fixingTrackCounts, setFixingTrackCounts] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
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
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [router]);

  const loadPlaylists = async () => {
    try {
      setLoadingPlaylists(true);
      setPlaylistsError(null);
      
      const response = await fetch('/api/playlists/user?limit=8'); // Get first 8 playlists for dashboard
      
      if (!response.ok) {
        throw new Error('Failed to load playlists');
      }
      
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setPlaylistsError('Failed to load playlists');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  // Polling para atualizar playlists em draft
  useEffect(() => {
    const interval = setInterval(() => {
      // Só faz polling se há playlists em draft
      const hasDrafts = playlists.some(p => p.status === 'draft');
      if (hasDrafts) {
        loadPlaylists();
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(interval);
  }, [playlists]);

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

  const handleConnectSpotify = async () => {
    setConnectingSpotify(true);
    try {
      window.location.href = '/api/auth/spotify';
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  if (!user) {
    return null;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 rounded-2xl md:rounded-3xl p-6 md:p-12 text-center border border-red-100">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                Crie sua playlist perfeita
              </h1>
              
              <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 leading-relaxed">
                Descreva o que você quer ouvir e nossa IA criará uma playlist personalizada 
                com as melhores músicas para o momento.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 py-3 text-base md:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  onClick={() => router.push("/dashboard/generate")}
                >
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Gerar com IA
                </Button>
                
                {!spotifyConnected && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 px-6 md:px-8 py-3 text-base md:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    onClick={handleConnectSpotify}
                    disabled={connectingSpotify}
                  >
                    <Music className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    {connectingSpotify ? 'Conectando...' : 'Conectar Spotify'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Back */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta, {user.email}
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Suas playlists criadas e descobertas musicais
          </p>
          
          {spotifyConnected && (
            <div className="mt-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <span className="text-green-800 font-medium text-sm md:text-base">
                  Spotify conectado! Você pode salvar playlists diretamente na sua conta.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Playlists Grid */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Playlists</h3>
              <NewPlaylistsCounter />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleFixTrackCounts}
                disabled={fixingTrackCounts}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                {fixingTrackCounts ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <Wrench className="w-3 h-3 mr-1" />
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
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
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
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Atualizar Previews
              </button>
              <Button variant="ghost" size="sm" className="text-gray-500">
                Ver todas
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
            {loadingPlaylists ? (
              // Loading state
              Array.from({ length: 4 }).map((_, i) => (
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
              ))
            ) : playlistsError ? (
              // Error state
              <div className="col-span-full text-center py-8">
                <div className="text-red-500 mb-2">Erro ao carregar playlists</div>
                <Button onClick={loadPlaylists} variant="outline" size="sm">
                  Tentar novamente
                </Button>
              </div>
            ) : playlists.length === 0 ? (
              // Empty state
              <div className="col-span-full text-center py-12">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma playlist ainda
                </h3>
                <p className="text-gray-600 mb-4">
                  Crie sua primeira playlist com IA!
                </p>
                <Button onClick={() => router.push("/dashboard/generate")}>
                  <Sparkles className="w-4 h-4 mr-2" />
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
                  />
                )
              ))
            )}
          </div>
        </div>

        {/* Recently Played */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">Tocadas recentemente</h3>
            <Button variant="ghost" size="sm" className="text-gray-500">
              Ver todas
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {loadingPlaylists ? (
              // Loading state for recent playlists
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : playlists.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">Nenhuma playlist recente</p>
              </div>
            ) : (
              playlists.slice(0, 3).map((playlist: Playlist) => (
                <Link key={`recent-${playlist.id}`} href={`/dashboard/playlist/${playlist.id}`}>
                  <Card className="group cursor-pointer hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${playlist.gradient || 'from-purple-500 to-blue-500'} rounded-lg flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 truncate">
                            {playlist.title}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
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