"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Play, Shuffle, Heart, MoreHorizontal, Download, Clock, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork?: string;
  preview_url?: string;
  spotify_id: string;
  found_on_spotify: boolean;
  position: number;
}

interface Playlist {
  id: string;
  title: string;
  creator: string;
  description?: string;
  prompt?: string;
  gradient: string;
  total_tracks: number;
  duration: string;
  spotify_playlist_id?: string;
  created_at: string;
  tracks: PlaylistTrack[];
}

export default function PlaylistPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);
        await loadPlaylist();
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [router, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPlaylist = useCallback(async () => {
    try {
      setLoadingPlaylist(true);
      setPlaylistError(null);

      const response = await fetch(`/api/playlists/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Playlist não encontrada');
        }
        throw new Error('Erro ao carregar playlist');
      }

      const data = await response.json();
      setPlaylist(data.playlist);
    } catch (error) {
      console.error('Error loading playlist:', error);
      setPlaylistError(error instanceof Error ? error.message : 'Erro ao carregar playlist');
    } finally {
      setLoadingPlaylist(false);
    }
  }, [params.id]);

  if (loading || loadingPlaylist) {
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

  if (playlistError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar playlist</h2>
          <p className="text-gray-600 mb-4">{playlistError}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={loadPlaylist} variant="outline">
              Tentar novamente
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-4">🎵</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Playlist não encontrada</h2>
          <p className="text-gray-600 mb-4">A playlist que você está procurando não existe ou foi removida.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="relative">
        {/* Header with Artwork and Info */}
        <div className={`bg-gradient-to-br ${playlist.gradient} relative`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-4 md:px-8 py-6 md:py-12 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-8">
            {/* Large Artwork */}
            <div className="w-32 h-32 md:w-64 md:h-64 bg-black/20 rounded-xl md:rounded-2xl shadow-2xl flex-shrink-0 overflow-hidden mx-auto md:mx-0">
              <div className={`w-full h-full bg-gradient-to-br ${playlist.gradient} flex items-center justify-center`}>
                <div className="text-white/30 text-3xl md:text-6xl font-bold">
                  {playlist.title.charAt(0)}
                </div>
              </div>
            </div>

            {/* Playlist Info */}
            <div className="text-white flex-1 min-w-0 text-center md:text-left">
              <p className="text-sm font-medium mb-2 opacity-90">Playlist</p>
              <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight">
                {playlist.title}
              </h1>
              <div className="mb-4 md:mb-6">
                <p className="text-red-300 font-semibold text-base md:text-lg mb-2">
                  {playlist.creator}
                </p>
                {playlist.description && (
                  <div className="text-sm opacity-90 max-w-2xl">
                    <p className="line-clamp-3">
                      {playlist.description}
                    </p>
                  </div>
                )}
                {playlist.prompt && (
                  <div className="mt-2 text-xs opacity-75 max-w-2xl">
                    <span className="font-medium">Prompt original:</span> {playlist.prompt}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm opacity-90 justify-center md:justify-start">
                <span>{playlist.total_tracks} músicas</span>
                <span>•</span>
                <span>{playlist.duration}</span>
                <span>•</span>
                <span>{formatDate(playlist.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 md:px-8 py-4 md:py-6 bg-white border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
            <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 py-3 rounded-full font-semibold flex-1 sm:flex-none"
                onClick={() => console.log("Play playlist:", playlist.id)}
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-2 ml-0.5" />
                Reproduzir
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="px-6 md:px-8 py-3 rounded-full font-semibold border-gray-300 flex-1 sm:flex-none"
                onClick={() => console.log("Shuffle playlist:", playlist.id)}
              >
                <Shuffle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Aleatório
              </Button>
            </div>

            <div className="flex items-center gap-1 md:gap-2 ml-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full p-2"
                onClick={() => console.log("Like playlist:", playlist.id)}
              >
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full p-2"
                onClick={() => console.log("Download playlist:", playlist.id)}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              {playlist.spotify_playlist_id && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full p-2"
                  onClick={() => window.open(`https://open.spotify.com/playlist/${playlist.spotify_playlist_id}`, '_blank')}
                >
                  <Music className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full p-2"
                onClick={() => console.log("More options:", playlist.id)}
              >
                <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="px-4 md:px-8 py-4 md:py-6">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b border-gray-200 mb-4">
            <div className="w-8"></div>
            <div>Música</div>
            <div>Artista</div>
            <div>Álbum</div>
            <div className="w-16 text-center">
              <Clock className="w-4 h-4 mx-auto" />
            </div>
          </div>

                    {/* Tracks */}
          <div className="space-y-1">
            {playlist.tracks.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Esta playlist não possui músicas</p>
              </div>
            ) : (
              <>
                {/* Desktop Track List */}
                <div className="hidden md:block">
                  {playlist.tracks.map((track: PlaylistTrack, index: number) => (
                    <div 
                      key={track.id}
                      className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 group cursor-pointer"
                      onClick={() => console.log("Play track:", track.id)}
                    >
                      {/* Track Number / Play Button */}
                      <div className="w-8 flex items-center justify-center">
                        <span className="text-sm text-gray-500 group-hover:hidden">
                          {index + 1}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-6 h-6 p-0 hidden group-hover:flex opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Play track:", track.id);
                          }}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Track Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0">
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 rounded"></div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {track.title}
                          </p>
                        </div>
                      </div>

                      {/* Artist */}
                      <div className="flex items-center min-w-0">
                        <p className="text-gray-600 truncate">
                          {track.artist}
                        </p>
                      </div>

                      {/* Album */}
                      <div className="flex items-center min-w-0">
                        <p className="text-gray-600 truncate">
                          {track.album}
                        </p>
                      </div>

                      {/* Duration & Actions */}
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Like track:", track.id);
                          }}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-500 min-w-[35px] text-center">
                          {track.duration}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("More options for track:", track.id);
                          }}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Track List */}
                <div className="md:hidden space-y-2">
                  {playlist.tracks.map((track: PlaylistTrack, index: number) => (
                    <div 
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => console.log("Play track:", track.id)}
                    >
                      {/* Track Number */}
                      <div className="w-8 flex items-center justify-center">
                        <span className="text-sm text-gray-500 font-medium">
                          {index + 1}
                        </span>
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {track.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {track.artist} • {track.album}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="text-sm text-gray-500">
                        {track.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
} 