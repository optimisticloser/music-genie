"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Music, Clock, Calendar, Loader2 } from "lucide-react";
import { FavoriteButton } from "@/components/playlist/PlaylistActionButtons";
import { ExpandableDescription } from "@/components/playlist/ExpandableDescription";
import { PlaylistActionButtons } from "@/components/playlist/PlaylistPageClient";
import { usePlaylistGenerationStream, CoverStatusEvent } from "@/hooks/usePlaylistGenerationStream";
import type { PlaylistGeneratorOutput } from "@/lib/workflowai/agents";

interface InitialTrack {
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  album_art_url?: string | null;
  duration_ms?: number | null;
  found_on_spotify?: boolean | null;
  position?: number | null;
}

interface InitialMetadata {
  primary_genre?: string | null;
  subgenre?: string | null;
  mood?: string | null;
  years?: string[] | null;
  energy_level?: string | null;
  tempo?: string | null;
  dominant_instruments?: string[] | null;
  vocal_style?: string | null;
  themes?: string[] | null;
  bpm_range?: string | null;
  key_signature?: string | null;
  language?: string | null;
  cultural_influence?: string | null;
}

interface InitialPlaylist {
  id: string;
  title?: string | null;
  description?: string | null;
  prompt?: string | null;
  creator?: string | null;
  total_tracks?: number | null;
  total_duration_ms?: number | null;
  spotify_playlist_id?: string | null;
  is_favorite?: boolean | null;
  created_at?: string | null;
  cover_art_url?: string | null;
  cover_art_description?: string | null;
  cover_art_metadata?: Record<string, unknown> | null;
  gradient?: string | null;
  status?: string | null;
  tracks: InitialTrack[];
  metadata?: InitialMetadata | null;
}

interface PlaylistLiveViewProps {
  playlistId: string;
  prompt: string;
  initial: InitialPlaylist;
  autoGenerate?: boolean;
  onPlaylistReady?: (playlistId: string) => void;
}

type TrackStatus =
  | "pending"
  | "searching"
  | "found"
  | "not_found"
  | "skipped"
  | "error"
  | "no_token";

interface TrackView {
  title?: string;
  artist?: string;
  album?: string;
  album_art_url?: string;
  duration_ms?: number;
  found_on_spotify?: boolean;
  position: number;
  status: TrackStatus;
}

interface PlaylistViewState {
  id: string;
  title?: string;
  description?: string;
  prompt?: string;
  creator?: string;
  total_tracks?: number;
  total_duration_ms?: number;
  spotify_playlist_id?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  cover_art_url?: string | null;
  cover_art_description?: string | null;
  cover_art_metadata?: Record<string, unknown> | null;
  gradient?: string | null;
  status?: string | null;
  tracks: TrackView[];
  metadata?: InitialMetadata | null;
}

function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPlaylistDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return "0m";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function buildInitialState(initial: InitialPlaylist): PlaylistViewState {
  const tracks: TrackView[] = (initial.tracks || []).map((track, index) => ({
    title: track.title ?? undefined,
    artist: track.artist ?? undefined,
    album: track.album ?? undefined,
    album_art_url: track.album_art_url ?? undefined,
    duration_ms: track.duration_ms ?? undefined,
    found_on_spotify: track.found_on_spotify ?? false,
    position: track.position ?? index + 1,
    status: track.found_on_spotify ? "found" : "pending",
  }));

  return {
    id: initial.id,
    title: initial.title ?? undefined,
    description: initial.description ?? undefined,
    prompt: initial.prompt ?? undefined,
    creator: initial.creator ?? undefined,
    total_tracks: initial.total_tracks ?? tracks.length,
    total_duration_ms: initial.total_duration_ms ?? undefined,
    spotify_playlist_id: initial.spotify_playlist_id ?? null,
    is_favorite: initial.is_favorite ?? false,
    created_at: initial.created_at ?? undefined,
    cover_art_url: initial.cover_art_url ?? null,
    cover_art_description: initial.cover_art_description ?? undefined,
    cover_art_metadata: initial.cover_art_metadata ?? null,
    gradient: initial.gradient ?? undefined,
    status: initial.status ?? undefined,
    tracks,
    metadata: initial.metadata ?? null,
  };
}

function mergePartialOutputIntoState(
  state: PlaylistViewState,
  output: PlaylistGeneratorOutput
): PlaylistViewState {
  const nextState: PlaylistViewState = {
    ...state,
    title: output.name ?? state.title,
    description: output.essay ?? state.description,
    total_tracks: output.songs?.length ?? state.total_tracks,
  };

  if (output.songs && output.songs.length > 0) {
    const tracks: TrackView[] = output.songs.map((song, index) => {
      const existing = state.tracks[index];
      return {
        title: song.title ?? existing?.title,
        artist: song.artist ?? existing?.artist,
        album: existing?.album,
        album_art_url: existing?.album_art_url,
        duration_ms: existing?.duration_ms,
        found_on_spotify: existing?.found_on_spotify,
        position: index + 1,
        status: existing?.status ?? "pending",
      };
    });
    nextState.tracks = tracks;
  }

  if (output.categorization && output.categorization.length > 0) {
    const categorization = output.categorization[0];
    nextState.metadata = {
      ...nextState.metadata,
      primary_genre: categorization.primary_genre,
      subgenre: categorization.subgenre,
      mood: categorization.mood,
      years: categorization.years,
      energy_level: categorization.energy_level,
      tempo: categorization.tempo,
      dominant_instruments: categorization.dominant_instruments,
      vocal_style: categorization.vocal_style,
      themes: categorization.themes,
    };
  }

  return nextState;
}

function mergeTrackProgress(
  tracks: TrackView[],
  progressMap: Record<number, { status: TrackStatus; song?: Record<string, unknown> }>
): TrackView[] {
  return tracks.map((track, index) => {
    const update = progressMap[index];
    if (!update) return track;
    const song = update.song || {};
    return {
      ...track,
      title: (song.title as string | undefined) ?? track.title,
      artist: (song.artist as string | undefined) ?? track.artist,
      album: (song.album_name as string | undefined) ?? track.album,
      album_art_url: (song.album_art_url as string | undefined) ?? track.album_art_url,
      duration_ms: (song.duration_ms as number | undefined) ?? track.duration_ms,
      found_on_spotify:
        update.status === "found"
          ? true
          : update.status === "not_found"
          ? false
          : track.found_on_spotify,
      position: track.position,
      status: update.status,
    };
  });
}

function mergeCompleteData(
  state: PlaylistViewState,
  completeData: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    playlist?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tracks?: any[];
    metadata?: InitialMetadata | null;
  }
): PlaylistViewState {
  const nextState = { ...state };
  if (completeData.playlist) {
    nextState.title = completeData.playlist.title ?? nextState.title;
    nextState.description = completeData.playlist.description ?? nextState.description;
    nextState.prompt = completeData.playlist.prompt ?? nextState.prompt;
    nextState.total_tracks = completeData.playlist.total_tracks ?? nextState.total_tracks;
    nextState.total_duration_ms =
      completeData.playlist.total_duration_ms ?? nextState.total_duration_ms;
    nextState.spotify_playlist_id =
      completeData.playlist.spotify_playlist_id ?? nextState.spotify_playlist_id;
    nextState.cover_art_url =
      completeData.playlist.cover_art_url ?? nextState.cover_art_url ?? null;
    nextState.cover_art_description =
      completeData.playlist.cover_art_description ?? nextState.cover_art_description;
    nextState.cover_art_metadata =
      completeData.playlist.cover_art_metadata ?? nextState.cover_art_metadata ?? null;
    nextState.status = completeData.playlist.status ?? nextState.status;
  }

  if (completeData.metadata) {
    nextState.metadata = {
      ...nextState.metadata,
      ...completeData.metadata,
    };
  }

  if (completeData.tracks && completeData.tracks.length > 0) {
    nextState.tracks = completeData.tracks.map((track: Record<string, unknown>, index) => ({
      title: (track.title as string | undefined) ?? state.tracks[index]?.title,
      artist: (track.artist as string | undefined) ?? state.tracks[index]?.artist,
      album: (track.album_name as string | undefined) ?? state.tracks[index]?.album,
      album_art_url:
        (track.album_art_url as string | undefined) ?? state.tracks[index]?.album_art_url,
      duration_ms:
        (track.duration_ms as number | undefined) ?? state.tracks[index]?.duration_ms,
      found_on_spotify:
        (track.found_on_spotify as boolean | undefined) ?? state.tracks[index]?.found_on_spotify,
      position: (track.position as number | undefined) ?? index + 1,
      status: (track.found_on_spotify as boolean | undefined)
        ? "found"
        : state.tracks[index]?.status ?? "pending",
    }));
  }

  return nextState;
}

function coverStatusMessage(status: CoverStatusEvent | null): string {
  if (!status) return "Pronto para gerar capa";
  switch (status.stage) {
    case "started":
      return "Gerando capa com IA…";
    case "success":
      return "Capa gerada automaticamente";
    case "error":
      return "Falha na geração da capa";
    default:
      return "";
  }
}

export function PlaylistLiveView({
  playlistId,
  prompt,
  initial,
  autoGenerate = false,
  onPlaylistReady,
}: PlaylistLiveViewProps) {
  const [viewState, setViewState] = useState<PlaylistViewState>(() =>
    buildInitialState(initial)
  );

  const {
    generate,
    isRunning,
    status,
    funMessage,
    partialOutput,
    spotifyProgress,
    spotifyPlaylistId,
    completeData,
    coverStatus,
    coverArtUrl,
  } = usePlaylistGenerationStream();

  const shouldAutoGenerate = autoGenerate || (initial.status ?? "draft") === "draft";

  useEffect(() => {
    if (!shouldAutoGenerate) {
      return;
    }
    generate(prompt, playlistId).catch((error) => {
      console.error("Failed to start playlist generation stream", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoGenerate, prompt, playlistId]);

  useEffect(() => {
    if (!partialOutput) return;
    setViewState((prev) => mergePartialOutputIntoState(prev, partialOutput));
  }, [partialOutput]);

  useEffect(() => {
    if (!spotifyProgress) return;
    setViewState((prev) => ({
      ...prev,
      tracks: mergeTrackProgress(prev.tracks, spotifyProgress),
    }));
  }, [spotifyProgress]);

  useEffect(() => {
    if (!completeData) return;

    setViewState((prev) =>
      mergeCompleteData(prev, {
        playlist: completeData.playlist,
        tracks: completeData.tracks ?? completeData.songs,
        metadata: completeData.metadata ?? null,
      })
    );

    if (completeData.playlist && 'id' in completeData.playlist && completeData.playlist.id) {
      onPlaylistReady?.(completeData.playlist.id as string);
    }
  }, [completeData, onPlaylistReady]);

  useEffect(() => {
    if (!coverArtUrl) return;
    setViewState((prev) => ({
      ...prev,
      cover_art_url: coverArtUrl,
    }));
  }, [coverArtUrl]);

  const coverMessage = coverStatusMessage(coverStatus);
  const displayGradient = useMemo(
    () => viewState.gradient ?? "from-purple-500 to-pink-500",
    [viewState.gradient]
  );

  const displayTracks = viewState.tracks.length > 0 ? viewState.tracks : Array.from({ length: 12 }).map((_, index) => ({
    position: index + 1,
    status: "pending" as TrackStatus,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={`bg-gradient-to-r ${displayGradient} px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl flex-shrink-0 overflow-hidden">
              {viewState.cover_art_url ? (
                <Image
                  src={viewState.cover_art_url}
                  alt={viewState.cover_art_description || viewState.title || "Cover art"}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover rounded-lg md:rounded-xl"
                />
              ) : (
                <Music className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white/60" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm text-white/80 mb-1 md:mb-2">Playlist</div>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 items-start sm:items-center mb-2 md:mb-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                  {viewState.title || (isRunning ? "Preparando playlist…" : "Playlist sem título")}
                </h1>
                <FavoriteButton
                  playlistId={viewState.id}
                  isFavorite={viewState.is_favorite}
                />
              </div>
              <p className="text-sm md:text-base lg:text-lg text-white/90 mb-2 md:mb-3">
                Criado por {viewState.creator || "Você"}
              </p>
              {viewState.description ? (
                <ExpandableDescription
                  description={viewState.description}
                  className="mb-2 md:mb-3"
                />
              ) : (
                isRunning && (
                  <div className="h-12 w-full max-w-xl bg-white/10 rounded-lg animate-pulse mb-3" />
                )
              )}
              {viewState.prompt && (
                <div className="mb-2 md:mb-3">
                  <span className="text-xs md:text-sm font-medium text-white/70">Prompt:</span>
                  <ExpandableDescription
                    description={viewState.prompt}
                    className="mt-1"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-white/80 mb-3 md:mb-4">
                <div className="flex items-center gap-1">
                  <Music className="w-3 h-3 md:w-4 md:h-4" />
                  {viewState.total_tracks ?? displayTracks.length} músicas
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  {formatPlaylistDuration(viewState.total_duration_ms)}
                </div>
                {viewState.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                    {new Date(viewState.created_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{status?.message || funMessage}</span>
                  </>
                ) : (
                  <span>{status?.message || "Playlist finalizada"}</span>
                )}
                <span className="text-white/60">•</span>
                <span>{coverMessage}</span>
              </div>

              <PlaylistActionButtons
                playlistId={viewState.id}
                spotifyPlaylistId={viewState.spotify_playlist_id || spotifyPlaylistId || undefined}
                playlistName={viewState.title || ""}
                playlistDescription={viewState.description || ""}
                songList={viewState.tracks
                  .filter((track) => track.title && track.artist)
                  .map((track) => `${track.artist} - ${track.title}`)
                  .join("; ")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {viewState.metadata && (
              <div className="xl:col-span-1 hidden xl:block">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-6">Metadados</h2>
                  <div className="space-y-4">
                    {viewState.metadata.primary_genre && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Gênero:</span>
                        <p className="text-base text-gray-900 mt-1">{viewState.metadata.primary_genre}</p>
                      </div>
                    )}
                    {viewState.metadata.mood && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Humor:</span>
                        <p className="text-base text-gray-900 mt-1">{viewState.metadata.mood}</p>
                      </div>
                    )}
                    {viewState.metadata.energy_level && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Energia:</span>
                        <p className="text-base text-gray-900 mt-1">{viewState.metadata.energy_level}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="xl:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Faixas</h2>
                <div className="space-y-3">
                  {displayTracks.map((track, index) => (
                    <div
                      key={track.position ?? index}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                          <span className="text-sm text-gray-500">{track.position}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {track.title || (isRunning ? "Título em geração…" : "Sem título")}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {track.artist || (isRunning ? "Artista em geração…" : "Sem artista")}
                          </div>
                          {track.album && (
                            <div className="text-xs text-gray-500 truncate">{track.album}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          {track.duration_ms ? formatDuration(track.duration_ms) : "--:--"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            track.status === "found"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : track.status === "searching"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : track.status === "not_found"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {track.status === "found"
                            ? "No Spotify"
                            : track.status === "searching"
                            ? "Buscando…"
                            : track.status === "not_found"
                            ? "Não encontrada"
                            : track.status === "error"
                            ? "Erro"
                            : track.status === "no_token"
                            ? "Sem token"
                            : "Processando"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
