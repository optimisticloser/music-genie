"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Heart,
  Clock,
  Music,
  Sparkles,
  Loader2,
} from "lucide-react";

interface PlaylistCardProps {
  playlist: {
    id: string;
    title: string;
    description?: string;
    gradient?: string;
    total_tracks: number;
    duration: string;
    created_at: string;
    spotify_playlist_id?: string;
    is_favorite?: boolean;
    status: "published" | "draft";
    cover_art_url?: string;
    cover_art_description?: string;
    viewed_at?: string;
  };
  variant?: "default" | "compact" | "featured";
  showActions?: boolean;
  onToggleFavorite?: (playlistId: string, currentFavorite: boolean) => void;
  onPlay?: (playlistId: string) => void;
}

export function PlaylistCard({
  playlist,
  variant = "default",
  showActions = true,
  onToggleFavorite,
  onPlay,
}: PlaylistCardProps) {
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const t = useTranslations("dashboard.playlistCard");
  const locale = useLocale();

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onToggleFavorite) return;

    setIsTogglingFavorite(true);
    try {
      await onToggleFavorite(playlist.id, playlist.is_favorite || false);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (playlist.spotify_playlist_id) {
      window.open(
        `https://open.spotify.com/playlist/${playlist.spotify_playlist_id}`,
        "_blank"
      );
    } else if (onPlay) {
      onPlay(playlist.id);
    }
  };

  const formatTrackCount = (count: number) => t("metadata.tracks", { count });

  const formatDate = (dateString: string) => {
    const formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return formatter.format(new Date(dateString));
  };

  const getGradientClass = (id: string, customGradient?: string) => {
    if (customGradient) return customGradient;

    const gradients = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-blue-500",
      "from-pink-500 to-rose-500",
      "from-yellow-500 to-orange-500",
    ];

    const index =
      id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      gradients.length;
    return gradients[index];
  };

  const renderCover = () => {
    const gradientClass = getGradientClass(playlist.id, playlist.gradient);

    return (
      <div
        className={`relative overflow-hidden rounded-t-lg ${
          variant === "compact" ? "aspect-square" : "h-32 md:h-48"
        }`}
      >
        {playlist.cover_art_url ? (
          <NextImage
            src={playlist.cover_art_url}
            alt={playlist.cover_art_description || playlist.title}
            fill
            sizes="(max-width: 768px) 50vw, 400px"
            className="object-cover"
            priority={variant === "featured"}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

        {playlist.status === "draft" && (
          <Badge className="absolute top-2 md:top-3 left-2 md:left-3 bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
            <Loader2 className="w-2 h-2 md:w-3 md:h-3 mr-1 animate-spin" />
            {t("status.generating")}
          </Badge>
        )}

        {playlist.status === "published" && !playlist.viewed_at && (
          <Badge className="absolute top-2 md:top-3 left-2 md:left-3 bg-green-500 hover:bg-green-600 text-white animate-pulse text-xs">
            <span className="text-xs font-bold">{t("status.new")}</span>
          </Badge>
        )}

        <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-purple-500 hover:bg-purple-600 text-white text-xs">
          <Sparkles className="w-2 h-2 md:w-3 md:h-3 mr-1" />
          {t("status.ai")}
        </Badge>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size={variant === "compact" ? "sm" : "lg"}
            className={`rounded-full shadow-lg transition-all duration-300 ${
              playlist.spotify_playlist_id
                ? "bg-green-500 hover:bg-green-600 text-white border-2 border-white"
                : "bg-white/90 hover:bg-white text-black"
            }`}
            onClick={handlePlay}
          >
            <Play
              className={`$ {
                variant === "compact"
                  ? "w-3 h-3 md:w-4 md:h-4"
                  : "w-4 h-4 md:w-6 md:h-6"
              } ml-0.5`}
            />
          </Button>
        </div>

        {showActions && (
          <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 md:w-8 md:h-8 p-0 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
            >
              {isTogglingFavorite ? (
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Heart
                  className={`w-3 h-3 md:w-4 md:h-4 transition-colors ${
                    playlist.is_favorite
                      ? "text-red-500 fill-current"
                      : "text-white/70 hover:text-red-400"
                  }`}
                />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderInfo = () => (
    <div
      className={`p-2 md:p-3 lg:p-4 ${
        variant === "compact" ? "p-2 md:p-3" : ""
      }`}
    >
      <h3
        className={`font-semibold text-gray-900 mb-1 ${
          variant === "compact"
            ? "text-xs md:text-sm line-clamp-2"
            : "text-sm md:text-base truncate"
        }`}
      >
        {playlist.title}
      </h3>

      {playlist.description && variant !== "compact" && (
        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2">
          {playlist.description}
        </p>
      )}

      <div
        className={`flex items-center gap-1 md:gap-2 text-xs text-gray-500 ${
          variant === "compact" ? "flex-col items-start gap-1" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <span className="flex items-center gap-1">
            <Music className="w-2 h-2 md:w-3 md:h-3" />
            <span className="text-xs">
              {formatTrackCount(playlist.total_tracks)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-2 h-2 md:w-3 md:h-3" />
            <span className="text-xs">{playlist.duration}</span>
          </span>
        </div>

        {playlist.spotify_playlist_id && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600 font-medium">
              {t("metadata.spotify")}
            </span>
          </div>
        )}
      </div>

      {variant !== "compact" && (
        <p className="text-xs text-gray-400 mt-1 md:mt-2">
          {formatDate(playlist.created_at)}
        </p>
      )}
    </div>
  );

  return (
    <Link href={{ pathname: "/dashboard/playlist/[id]", params: { id: playlist.id } }}>
      <Card
        className={`group cursor-pointer transition-all duration-300 p-0 ${
          variant === "featured"
            ? "hover:shadow-xl hover:scale-105"
            : "hover:shadow-lg hover:scale-[1.02]"
        } ${variant === "compact" ? "max-w-[160px] md:max-w-[200px]" : ""}`}
      >
        <CardContent className="p-0">
          {renderCover()}
          {renderInfo()}
        </CardContent>
      </Card>
    </Link>
  );
}
