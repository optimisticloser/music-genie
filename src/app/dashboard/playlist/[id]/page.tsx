"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, MoreHorizontal, Clock, Music, ExternalLink } from 'lucide-react';
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
  is_favorite?: boolean;
  created_at: string;
  tracks: PlaylistTrack[];
}

export default function PlaylistPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isAddedToSpotify, setIsAddedToSpotify] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

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
      setIsAddedToSpotify(!!data.playlist.spotify_playlist_id);
      setIsFavorite(data.playlist.is_favorite || false);
    } catch (error) {
      console.error('Error loading playlist:', error);
      setPlaylistError(error instanceof Error ? error.message : 'Erro ao carregar playlist');
    } finally {
      setLoadingPlaylist(false);
    }
  }, [params.id]);

  const handlePlayPreview = async (track: PlaylistTrack) => {
    console.log('🎵 Attempting to play preview for track:', track.title);
    console.log('🎵 Preview URL:', track.preview_url);
    
    if (!track.preview_url) {
      console.log('❌ No preview URL available for track:', track.title);
      return;
    }

    if (playingTrack === track.id) {
      // Pausar
      console.log('⏸️ Pausing track:', track.title);
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      setPlayingTrack(null);
    } else {
      // Parar áudio anterior
      if (audio) {
        console.log('🛑 Stopping previous audio');
        audio.pause();
        audio.currentTime = 0;
      }

      // Tocar nova música
      console.log('▶️ Playing new track:', track.title);
      const newAudio = new Audio(track.preview_url);
      
      newAudio.addEventListener('ended', () => {
        console.log('🔚 Track ended:', track.title);
        setPlayingTrack(null);
        setAudio(null);
      });
      
      newAudio.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e);
        setPlayingTrack(null);
        setAudio(null);
      });
      
      try {
        await newAudio.play();
        setAudio(newAudio);
        setPlayingTrack(track.id);
        console.log('✅ Track started playing:', track.title);
      } catch (error) {
        console.error('❌ Failed to play track:', error);
        setPlayingTrack(null);
        setAudio(null);
      }
    }
  };

  const handleAddToSpotify = async () => {
    if (!playlist) return;

    try {
      const response = await fetch('/api/playlist/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlistId: playlist.id,
          saveToSpotify: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.spotify_playlist_id) {
          setIsAddedToSpotify(true);
          setPlaylist(prev => prev ? { ...prev, spotify_playlist_id: data.spotify_playlist_id } : null);
        }
      }
    } catch (error) {
      console.error('Error adding to Spotify:', error);
    }
  };

  const handleOpenSpotify = () => {
    if (playlist?.spotify_playlist_id) {
      window.open(`https://open.spotify.com/playlist/${playlist.spotify_playlist_id}`, '_blank');
    }
  };

  const handleToggleFavorite = async () => {
    if (!playlist || isTogglingFavorite) return;

    try {
      setIsTogglingFavorite(true);
      const newFavoriteStatus = !isFavorite;

      const response = await fetch(`/api/playlists/${playlist.id}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: newFavoriteStatus }),
      });

      if (response.ok) {
        setIsFavorite(newFavoriteStatus);
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

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

  if (playlistError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{playlistError}</p>
          <Button onClick={loadPlaylist}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Playlist não encontrada</p>
          <Button onClick={() => router.push('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
              <div className="flex items-center gap-4 mb-3 md:mb-4">
                <h1 className="text-2xl md:text-5xl font-bold leading-tight break-words">
                  {playlist.title}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-red-50 transition-colors"
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                >
                  <Heart 
                    className={`w-6 h-6 md:w-8 md:h-8 transition-colors ${
                      isFavorite 
                        ? 'text-red-500 fill-current' 
                        : 'text-gray-400 hover:text-red-400'
                    }`} 
                  />
                </Button>
              </div>
              <div className="mb-4 md:mb-6">
                <p className="text-red-300 font-semibold text-base md:text-lg mb-2 break-words">
                  {playlist.creator}
                </p>
                {playlist.description && (
                  <div className="text-sm opacity-90 max-w-2xl">
                    <p className="line-clamp-3 break-words">
                      {playlist.description}
                    </p>
                  </div>
                )}
                {playlist.prompt && (
                  <div className="mt-2 text-xs opacity-75 max-w-2xl">
                    <span className="font-medium">Prompt original:</span> 
                    <span className="break-words"> {playlist.prompt}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm opacity-90 justify-center md:justify-start flex-wrap">
                <span>{playlist.total_tracks} músicas</span>
                <span>•</span>
                <span>{playlist.duration}</span>
                <span>•</span>
                <span>{formatDate(playlist.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spotify Action Button */}
        <div className="px-4 md:px-8 py-6 bg-white border-b border-gray-100">
          <div className="flex justify-center">
            {isAddedToSpotify ? (
              <Button 
                size="lg" 
                className="bg-green-500 hover:bg-green-600 text-black px-8 md:px-12 py-4 rounded-full font-semibold text-lg flex items-center gap-3"
                onClick={handleOpenSpotify}
              >
                <ExternalLink className="w-5 h-5" />
                Ouvir no Spotify
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="bg-green-500 hover:bg-green-600 text-black px-8 md:px-12 py-4 rounded-full font-semibold text-lg flex items-center gap-3"
                onClick={handleAddToSpotify}
              >
                <Music className="w-5 h-5" />
                Adicionar ao Spotify
              </Button>
            )}
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
                    >
                      {/* Track Number / Play Button */}
                      <div className="w-8 flex items-center justify-center">
                        <span className="text-sm text-gray-500 group-hover:hidden">
                          {index + 1}
                        </span>
                        {track.preview_url && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-6 h-6 p-0 hidden group-hover:flex opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPreview(track);
                            }}
                          >
                            {playingTrack === track.id ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0 relative overflow-hidden">
                          {track.artwork ? (
                            <Image 
                              src={track.artwork} 
                              alt={`${track.title} album art`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('❌ Failed to load image for track:', track.title);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 rounded"></div>
                          )}
                          {track.preview_url && playingTrack === track.id && (
                            <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                              <Pause className="w-4 h-4 text-white" />
                            </div>
                          )}
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
                      onClick={() => track.preview_url && handlePlayPreview(track)}
                    >
                      {/* Track Number / Play Button */}
                      <div className="w-8 flex items-center justify-center">
                        {track.preview_url ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPreview(track);
                            }}
                          >
                            {playingTrack === track.id ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500 font-medium">
                            {index + 1}
                          </span>
                        )}
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