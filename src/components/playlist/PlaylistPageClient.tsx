"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Play, ExternalLink } from "lucide-react";

interface PlaylistActionButtonsProps {
  playlistId: string;
  spotifyPlaylistId?: string;
  playlistName?: string;
  playlistDescription?: string;
  songList?: string;
}

export function PlaylistActionButtons({ 
  playlistId, 
  spotifyPlaylistId,
  playlistName = "",
  playlistDescription = "",
  songList = ""
}: PlaylistActionButtonsProps) {
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  const handleUpdateImages = async () => {
    setIsUpdatingImages(true);
    try {
      const response = await fetch('/api/playlist/update-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playlist_id: playlistId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update images');
      }

      await response.json();
      // Refresh the page to show updated images
      window.location.reload();
    } catch (error) {
      console.error('Error updating playlist images:', error);
    } finally {
      setIsUpdatingImages(false);
    }
  };

  const handleGenerateCover = async () => {
    setIsGeneratingCover(true);
    try {
      const response = await fetch('/api/playlist/generate-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist_name: playlistName,
          playlist_description: playlistDescription,
          song_list: songList,
          style_preferences: "Bright, energetic, vibrant",
          color_preferences: "Vibrant yellows, energetic oranges, and bright magentas",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover art');
      }

      const data = await response.json();
      console.log('✅ Cover art generated:', data);

      // Verificar se temos a URL da capa
      if (!data.cover_art?.url) {
        console.error('❌ No cover art URL received:', data);
        throw new Error('No cover art URL received from generation');
      }

      // Atualizar a playlist com a URL da capa gerada
      const updateResponse = await fetch('/api/playlist/update-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist_id: playlistId,
          cover_art_url: data.cover_art.url,
          cover_art_description: data.design_description || data.cover_art.description,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('❌ Update response error:', errorData);
        throw new Error(errorData.error || 'Failed to update playlist with cover art');
      }

      const updateData = await updateResponse.json();
      console.log('✅ Playlist updated successfully:', updateData);
      
      // Refresh the page to show the new cover
      window.location.reload();

    } catch (error) {
      console.error('Error generating cover art:', error);
      alert(`Erro ao gerar capa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleSpotifyOpen = () => {
    if (spotifyPlaylistId) {
      window.open(`https://open.spotify.com/playlist/${spotifyPlaylistId}`, '_blank');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {spotifyPlaylistId && (
        <Button
          className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSpotifyOpen}
        >
          <Play className="w-4 h-4 mr-2" />
          Ouvir no Spotify
        </Button>
      )}
      <Button
        variant="outline"
        className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-white/20 border-white/30 text-white hover:bg-white/30"
        onClick={handleUpdateImages}
        disabled={isUpdatingImages}
      >
        {isUpdatingImages ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4 mr-2" />
        )}
        {isUpdatingImages ? 'Atualizando...' : 'Atualizar Imagens'}
      </Button>
      <Button
        variant="outline"
        className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm bg-white/20 border-white/30 text-white hover:bg-white/30"
        onClick={handleGenerateCover}
        disabled={isGeneratingCover}
      >
        {isGeneratingCover ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {isGeneratingCover ? 'Gerando...' : 'Criar capa com IA'}
      </Button>
    </div>
  );
} 