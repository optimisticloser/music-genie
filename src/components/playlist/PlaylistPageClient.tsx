"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Play, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

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
  const t = useTranslations("dashboard.playlist");
  const router = useRouter();

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
      toast.success(t("actions.refreshImages.success"));
      router.refresh();
    } catch (error) {
      console.error('Error updating playlist images:', error);
      toast.error(t("actions.refreshImages.error"));
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

      if (!data.cover_art?.url) {
        throw new Error('No cover art URL received from generation');
      }

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

      await updateResponse.json();
      toast.success(t("actions.generateCover.success"));
      router.refresh();
    } catch (error) {
      console.error('Error generating cover art:', error);
      toast.error(t("actions.generateCover.error"));
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleSpotifyOpen = () => {
    if (spotifyPlaylistId) {
      window.open(`https://open.spotify.com/playlist/${spotifyPlaylistId}`, '_blank');
      return;
    }
    toast.info(t("toasts.spotifyUnavailable"));
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {spotifyPlaylistId && (
        <Button
          className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSpotifyOpen}
        >
          <Play className="w-4 h-4 mr-2" />
          {t("actions.openSpotify.label")}
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
        {isUpdatingImages ? t("actions.refreshImages.loading") : t("actions.refreshImages.label")}
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
        {isGeneratingCover ? t("actions.generateCover.loading") : t("actions.generateCover.label")}
      </Button>
    </div>
  );
} 
