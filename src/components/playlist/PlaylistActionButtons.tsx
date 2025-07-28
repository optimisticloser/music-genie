"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Play, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";

interface PlaylistActionButtonsProps {
  playlistId: string;
  spotifyPlaylistId?: string;
  isFavorite?: boolean;
}

export function PlaylistActionButtons({ 
  playlistId, 
  spotifyPlaylistId, 
  isFavorite = false 
}: PlaylistActionButtonsProps) {
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);

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
    } catch (error) {
      console.error('Error updating playlist images:', error);
    } finally {
      setIsUpdatingImages(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
      {spotifyPlaylistId && (
        <Button
          className="px-6 md:px-8 lg:px-12 py-3 md:py-4 text-base md:text-lg bg-green-600 hover:bg-green-700"
          onClick={() => window.open(`https://open.spotify.com/playlist/${spotifyPlaylistId}`, '_blank')}
        >
          <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Ouvir no Spotify
        </Button>
      )}
      <Button
        variant="outline"
        className="px-4 md:px-6 lg:px-8 py-3 md:py-4 text-sm md:text-base"
        onClick={handleUpdateImages}
        disabled={isUpdatingImages}
      >
        <ExternalLink className="w-4 h-4 md:w-5 md:h-5 mr-2" />
        {isUpdatingImages ? 'Atualizando...' : 'Atualizar Imagens'}
      </Button>
    </div>
  );
}

export function FavoriteButton({ 
  playlistId, 
  isFavorite = false 
}: { 
  playlistId: string; 
  isFavorite?: boolean; 
}) {
  const { toggleFavorite, isToggling } = useFavoriteToggle();
  const [localFavorite, setLocalFavorite] = useState(isFavorite);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalFavorite(isFavorite);
  }, [isFavorite]);

  const handleToggle = async () => {
    const success = await toggleFavorite(playlistId, localFavorite);
    if (success) {
      setLocalFavorite(!localFavorite);
    }
  };

  const isLoading = isToggling(playlistId);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-white hover:bg-white/20 p-1 md:p-2"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 animate-spin" />
      ) : (
        <Heart className={`w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 transition-colors ${
          localFavorite ? 'fill-red-500 text-red-500' : 'text-white/70 hover:text-red-400'
        }`} />
      )}
    </Button>
  );
} 