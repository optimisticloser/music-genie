"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Heart } from "lucide-react";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";

interface PlaylistActionButtonsProps {
  playlistId: string;
  spotifyPlaylistId?: string;
  isFavorite?: boolean;
}

export function PlaylistActionButtons({ 
  playlistId, 
  spotifyPlaylistId
}: PlaylistActionButtonsProps) {
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);

  const resolvedSpotifyUrl = useMemo(() => {
    if (!spotifyPlaylistId) {
      return null;
    }

    try {
      const parsed = JSON.parse(spotifyPlaylistId);
      if (typeof parsed === "string") {
        return `https://open.spotify.com/playlist/${parsed}`;
      }
      if (parsed && typeof parsed === "object") {
        if (parsed.external_url) {
          return parsed.external_url as string;
        }
        if (parsed.id) {
          return `https://open.spotify.com/playlist/${parsed.id as string}`;
        }
        if (parsed.uri && typeof parsed.uri === "string") {
          const parts = parsed.uri.split(":");
          return parts.length ? `https://open.spotify.com/playlist/${parts.pop()}` : null;
        }
      }
    } catch {
      // not JSON, fall back to raw string below
    }

    return `https://open.spotify.com/playlist/${spotifyPlaylistId}`;
  }, [spotifyPlaylistId]);

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
    <div className="flex w-full flex-col sm:flex-row justify-start sm:items-center gap-3 md:gap-4">
      {resolvedSpotifyUrl && (
        <Button
          className="px-6 md:px-8 lg:px-12 py-3 md:py-4 text-base md:text-lg bg-green-600 hover:bg-green-700"
          onClick={() => window.open(resolvedSpotifyUrl, '_blank')}
        >
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Ouvir no Spotify
        </Button>
      )}
      <Button
        variant="outline"
        className="px-4 md:px-6 lg:px-8 py-3 md:py-4 text-sm md:text-base"
        onClick={handleUpdateImages}
        disabled={isUpdatingImages}
      >
        <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
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
      className="text-white hover:bg-white/20 p-1 md:p-2 rounded-full"
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
