import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { RunStreamEvent } from "@workflowai/workflowai";
// import type { Database } from "@/lib/supabase/database.types";
import {
  playlistGeneratorAgent,
  PlaylistGeneratorInput,
  PlaylistGeneratorOutput,
} from "@/lib/workflowai/agents";
import { SpotifyService } from "@/lib/services/spotify";
import {
  addTracksToPlaylist,
  createPlaylist,
  getCurrentUser,
} from "@/lib/spotify/api";
import {
  generatePlaylistCover,
  CoverGenerationStatus,
} from "@/lib/services/workflowai";

type WorkflowMetrics = Record<string, unknown> | null;

interface EnrichedSong {
  title?: string;
  artist?: string;
  spotify_id?: string;
  album_name?: string;
  album_art_url?: string;
  duration_ms?: number;
  preview_url?: string;
  external_url?: string;
  found_on_spotify?: boolean;
  position?: number;
}

interface StreamEventPayload {
  [key: string]: unknown;
}

type StreamEventName =
  | "status"
  | "ai_update"
  | "spotify_progress"
  | "cover_status"
  | "playlist_saved"
  | "complete"
  | "error"
  | "diagnostic";

const encoder = new TextEncoder();

function enqueueEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: StreamEventName,
  payload: StreamEventPayload
) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  controller.enqueue(encoder.encode(data));
}

function calculateTotalDuration(songs: EnrichedSong[]): number {
  return songs.reduce((total, song) => total + (song.duration_ms || 0), 0);
}

interface PlaylistSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playlist: any;
  tracks: EnrichedSong[];
  metadata: Record<string, unknown> | null;
}

type PlaylistTrackRow = {
  track_name?: string | null;
  artist_name?: string | null;
  album_name?: string | null;
  album_art_url?: string | null;
  duration_ms?: number | null;
  preview_url?: string | null;
  spotify_track_id?: string | null;
  found_on_spotify?: boolean | null;
  position?: number | null;
};

async function fetchPlaylistSnapshot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  playlistId: string,
  userId: string
): Promise<PlaylistSnapshot | null> {
  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .eq("user_id", userId)
    .single();

  if (playlistError || !playlist) {
    return null;
  }

  const { data: tracksData, error: tracksError } = await supabase
    .from("playlist_tracks")
    .select("*")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  if (tracksError) {
    console.error("Error fetching playlist tracks snapshot", tracksError);
  }

  const { data: metadataRows, error: metadataError } = await supabase
    .from("playlist_metadata")
    .select("*")
    .eq("playlist_id", playlistId)
    .limit(1);

  if (metadataError) {
    console.error("Error fetching playlist metadata snapshot", metadataError);
  }

  const tracks: EnrichedSong[] = ((tracksData || []) as PlaylistTrackRow[]).map(
    (track, index) => {
      const spotifyId =
        track.spotify_track_id && !track.spotify_track_id.startsWith("not_found_")
          ? track.spotify_track_id
          : undefined;

      return {
        title: track.track_name || undefined,
        artist: track.artist_name || undefined,
        spotify_id: spotifyId,
        album_name: track.album_name || undefined,
        album_art_url: track.album_art_url || undefined,
        duration_ms: track.duration_ms || undefined,
        preview_url: track.preview_url || undefined,
        external_url: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : undefined,
        found_on_spotify: track.found_on_spotify ?? false,
        position: track.position ?? index + 1,
      };
    }
  );

  const spotifyPlaylistIdValue =
    typeof playlist.spotify_playlist_id === "string"
      ? playlist.spotify_playlist_id
      : playlist.spotify_playlist_id?.id ?? null;

  const normalizedPlaylist = {
    ...playlist,
    spotify_playlist_id: spotifyPlaylistIdValue,
  };

  return {
    playlist: normalizedPlaylist,
    tracks,
    metadata: metadataRows && metadataRows.length > 0 ? metadataRows[0] : null,
  };
}

async function savePlaylistData({
  supabase,
  prompt,
  playlistId,
  userId,
  output,
  songs,
  spotifyPlaylistId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  prompt: string;
  playlistId?: string | null;
  userId: string;
  output: PlaylistGeneratorOutput;
  songs: EnrichedSong[];
  spotifyPlaylistId: { id: string } | null;
}): Promise<PlaylistSnapshot | null> {
  const totalDurationMs = calculateTotalDuration(songs);

  if (playlistId) {
    const { error: updateError } = await supabase
      .from("playlists")
      .update({
        title: output.name,
        description: output.essay,
        status: "published",
        total_tracks: songs.length,
        total_duration_ms: totalDurationMs,
        spotify_playlist_id: spotifyPlaylistId?.id,
      })
      .eq("id", playlistId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Update playlist error", updateError);
    }

    if (songs.length > 0) {
      const tracks = songs.map((song, index) => ({
        playlist_id: playlistId,
        spotify_track_id: song.spotify_id || `not_found_${index}`,
        track_name: song.title || "",
        artist_name: song.artist || "",
        album_name: song.album_name || "",
        album_art_url: song.album_art_url || null,
        duration_ms: song.duration_ms || 0,
        preview_url: song.preview_url || null,
        position: index + 1,
        found_on_spotify: song.found_on_spotify || false,
      }));

      const { error: tracksError } = await supabase
        .from("playlist_tracks")
        .insert(tracks);

      if (tracksError) {
        console.error("Error saving tracks", tracksError);
      }
    }

    if (output.categorization && output.categorization.length > 0) {
      const categorization = output.categorization[0];
      const { error: metadataError } = await supabase
        .from("playlist_metadata")
        .upsert(
          {
            playlist_id: playlistId,
            primary_genre: categorization.primary_genre,
            subgenre: categorization.subgenre,
            mood: categorization.mood,
            years: categorization.years,
            energy_level: categorization.energy_level,
            tempo: categorization.tempo,
            dominant_instruments: categorization.dominant_instruments,
            vocal_style: categorization.vocal_style,
            themes: categorization.themes,
          },
          {
            onConflict: "playlist_id",
          }
        );

      if (metadataError) {
        console.error("Error saving metadata", metadataError);
      }
    }

    return await fetchPlaylistSnapshot(supabase, playlistId, userId);
  }

  const { data: lineage, error: lineageError } = await supabase
    .from("playlist_lineage")
    .insert({
      original_prompt: prompt,
      user_id: userId,
    })
    .select()
    .single();

  if (lineageError) {
    throw lineageError;
  }

  const { data: created, error: playlistError } = await supabase
    .from("playlists")
    .insert({
      lineage_id: lineage.id,
      user_id: userId,
      title: output.name,
      description: output.essay,
      prompt,
      version: 1,
      status: "published",
      sharing_permission: "private",
      spotify_playlist_id: spotifyPlaylistId?.id ?? null,
      total_tracks: songs.length,
      total_duration_ms: totalDurationMs,
    })
    .select()
    .single();

  if (playlistError) {
    throw playlistError;
  }

  if (songs.length > 0) {
    const tracks = songs.map((song, index) => ({
      playlist_id: created.id,
      spotify_track_id: song.spotify_id || `not_found_${index}`,
      track_name: song.title || "",
      artist_name: song.artist || "",
      album_name: song.album_name || "",
      album_art_url: song.album_art_url || null,
      duration_ms: song.duration_ms || 0,
      preview_url: song.preview_url || null,
      position: index + 1,
      found_on_spotify: song.found_on_spotify || false,
    }));

    const { error: tracksError } = await supabase
      .from("playlist_tracks")
      .insert(tracks);

    if (tracksError) {
      console.error("Error saving tracks", tracksError);
    }
  }

  if (output.categorization && output.categorization.length > 0) {
    const categorization = output.categorization[0];
    const { error: metadataError } = await supabase
      .from("playlist_metadata")
      .insert({
        playlist_id: created.id,
        primary_genre: categorization.primary_genre,
        subgenre: categorization.subgenre,
        mood: categorization.mood,
        years: categorization.years,
        energy_level: categorization.energy_level,
        tempo: categorization.tempo,
        dominant_instruments: categorization.dominant_instruments,
        vocal_style: categorization.vocal_style,
        themes: categorization.themes,
      });

    if (metadataError) {
      console.error("Error saving metadata", metadataError);
    }
  }

  return await fetchPlaylistSnapshot(supabase, created.id, userId);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.error("Error setting cookies", error);
          }
        },
      },
    }
  );

  let body: PlaylistGeneratorInput & { playlist_id?: string };

  try {
    body = await req.json();
  } catch (error) {
    console.error("Invalid JSON", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, playlist_id: playlistId } = body;

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSpotifyConnected = await SpotifyService.isSpotifyConnected(user.id);
  let spotifyAccessToken: string | null = null;
  if (isSpotifyConnected) {
    spotifyAccessToken = await SpotifyService.getValidAccessToken(user.id);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const notify = (event: StreamEventName, payload: StreamEventPayload) =>
        enqueueEvent(controller, event, payload);
      const emitDiagnostic = (
        stage: string,
        payload: unknown,
        metadata: Record<string, unknown> = {}
      ) => {
        notify("diagnostic", {
          stage,
          payload,
          timestamp: new Date().toISOString(),
          ...metadata,
        });
      };

      try {
        emitDiagnostic("request_body", body);
        notify("status", {
          stage: "starting",
          message: "Preparando geração da playlist…",
        });

        let metrics: WorkflowMetrics = null;
        let latestOutput: PlaylistGeneratorOutput | null = null;

        let existingSnapshot: PlaylistSnapshot | null = null;
        if (playlistId) {
          existingSnapshot = await fetchPlaylistSnapshot(supabase, playlistId, user.id);
        }

        if (existingSnapshot?.playlist?.status === "published") {
          const isSpotifyConnected = await SpotifyService.isSpotifyConnected(user.id);

          if (existingSnapshot.tracks.length > 0) {
            notify("ai_update", {
              output: {
                name: existingSnapshot.playlist.title,
                essay: existingSnapshot.playlist.description,
                songs: existingSnapshot.tracks.map((track) => ({
                  title: track.title,
                  artist: track.artist,
                })),
                categorization: existingSnapshot.metadata
                  ? [
                      {
                        primary_genre: existingSnapshot.metadata["primary_genre"] as
                          | string
                          | undefined,
                        subgenre: existingSnapshot.metadata["subgenre"] as
                          | string
                          | undefined,
                        mood: existingSnapshot.metadata["mood"] as
                          | string
                          | undefined,
                        years: existingSnapshot.metadata["years"] as
                          | string[]
                          | undefined,
                        energy_level: existingSnapshot.metadata[
                          "energy_level"
                        ] as string | undefined,
                        tempo: existingSnapshot.metadata["tempo"] as
                          | string
                          | undefined,
                        dominant_instruments: existingSnapshot.metadata[
                          "dominant_instruments"
                        ] as string[] | undefined,
                        vocal_style: existingSnapshot.metadata["vocal_style"] as
                          | string
                          | undefined,
                        themes: existingSnapshot.metadata["themes"] as
                          | string[]
                          | undefined,
                      },
                    ]
                  : undefined,
              },
            });
          }

          if (existingSnapshot.playlist.cover_art_url) {
            notify("cover_status", {
              stage: "success",
              cover_art_url: existingSnapshot.playlist.cover_art_url,
              cover_art_description: existingSnapshot.playlist.cover_art_description,
              metadata:
                (existingSnapshot.playlist.cover_art_metadata as Record<string, unknown>) ||
                null,
            });
          }

          notify("playlist_saved", {
            playlist_id: existingSnapshot.playlist.id,
            spotify_playlist_id: existingSnapshot.playlist.spotify_playlist_id || undefined,
          });

          notify("complete", {
            playlist: existingSnapshot.playlist,
            tracks: existingSnapshot.tracks,
            metadata: existingSnapshot.metadata,
            songs: existingSnapshot.tracks,
            spotify_connected: isSpotifyConnected,
            metrics,
          });
          return;
        }

        notify("status", {
          stage: "starting",
          message: "Preparando geração da playlist…",
        });

        const maxSpotifyConcurrency = 4;
        let activeSpotifyRequests = 0;
        const spotifyMatchQueue: Array<() => Promise<void>> = [];
        const matchedSongIndices = new Set<number>();
        const pendingSpotifyMatches: Promise<void>[] = [];
        // metrics already declared above
        // latestOutput already declared above
        let latestSongs: PlaylistGeneratorOutput["songs"] = [];
        let enrichedSongs: EnrichedSong[] = [];

        const updateEnrichedSongAtIndex = (
          index: number,
          data: Partial<EnrichedSong>
        ) => {
          const current = enrichedSongs[index] || {};
          enrichedSongs[index] = {
            title: data.title ?? current.title,
            artist: data.artist ?? current.artist,
            spotify_id: data.spotify_id ?? current.spotify_id,
            album_name: data.album_name ?? current.album_name,
            album_art_url: data.album_art_url ?? current.album_art_url,
            duration_ms: data.duration_ms ?? current.duration_ms,
            preview_url: data.preview_url ?? current.preview_url,
            external_url: data.external_url ?? current.external_url,
            found_on_spotify: data.found_on_spotify ?? current.found_on_spotify ?? false,
            position: data.position ?? current.position ?? index + 1,
          };
        };

        const processSpotifyQueue = () => {
          if (!spotifyAccessToken) {
            return;
          }
          while (
            activeSpotifyRequests < maxSpotifyConcurrency &&
            spotifyMatchQueue.length > 0
          ) {
            const job = spotifyMatchQueue.shift();
            if (!job) {
              continue;
            }
            activeSpotifyRequests++;
            job()
              .catch((error) => {
                console.error("Spotify match job error", error);
              })
              .finally(() => {
                activeSpotifyRequests--;
                processSpotifyQueue();
              });
          }
        };

        const enqueueSpotifyMatch = (job: () => Promise<void>) => {
          spotifyMatchQueue.push(job);
          processSpotifyQueue();
        };

        const scheduleSpotifyMatch = (
          index: number,
          song?: { title?: string | null; artist?: string | null }
        ) => {
          const title = song?.title ? song.title.trim() : null;
          const artist = song?.artist ? song.artist.trim() : null;

          if (!title || !artist) {
            return;
          }

          if (!spotifyAccessToken) {
            if (!matchedSongIndices.has(index)) {
              matchedSongIndices.add(index);
              updateEnrichedSongAtIndex(index, {
                title,
                artist,
                found_on_spotify: false,
              });
              notify("spotify_progress", {
                index,
                status: "no_token",
                song: enrichedSongs[index],
              });
            }
            return;
          }

          if (matchedSongIndices.has(index)) {
            return;
          }
          matchedSongIndices.add(index);

          const promise = new Promise<void>((resolve) => {
            enqueueSpotifyMatch(async () => {
              updateEnrichedSongAtIndex(index, { title, artist });
              notify("spotify_progress", {
                index,
                status: "searching",
                song: {
                  title,
                  artist,
                },
              });

              try {
                const searchQuery = artist + " " + title;
                const searchUrl =
                  "https://api.spotify.com/v1/search?q=" +
                  encodeURIComponent(searchQuery) +
                  "&type=track&limit=1";

                emitDiagnostic(
                  "spotify_search_request",
                  {
                    query: searchQuery,
                    url: searchUrl,
                  },
                  { index }
                );

                const response = await fetch(searchUrl, {
                  headers: {
                    Authorization: "Bearer " + spotifyAccessToken,
                  },
                });

                if (response.ok) {
                  const searchData = await response.json();
                  emitDiagnostic(
                    "spotify_search_response",
                    {
                      status: response.status,
                      body: searchData,
                    },
                    { index }
                  );
                  const track = searchData.tracks?.items?.[0];
                  if (track) {
                    const enriched: EnrichedSong = {
                      title,
                      artist,
                      spotify_id: track.id,
                      album_name: track.album?.name,
                      album_art_url: track.album?.images?.[0]?.url,
                      duration_ms: track.duration_ms,
                      preview_url: track.preview_url,
                      external_url: track.external_urls?.spotify,
                      found_on_spotify: true,
                      position: index + 1,
                    };
                    enrichedSongs[index] = enriched;
                    notify("spotify_progress", {
                      index,
                      status: "found",
                      song: enriched,
                    });
                    resolve();
                    return;
                  }
                }

                if (!response.ok) {
                  const errorText = await response.text();
                  emitDiagnostic(
                    "spotify_search_response",
                    {
                      status: response.status,
                      error: errorText,
                    },
                    { index }
                  );
                }

                updateEnrichedSongAtIndex(index, {
                  title,
                  artist,
                  found_on_spotify: false,
                });
                notify("spotify_progress", {
                  index,
                  status: "not_found",
                  song: enrichedSongs[index],
                });
              } catch (error) {
                console.error("Spotify search error", error);
                emitDiagnostic(
                  "spotify_search_error",
                  {
                    message:
                      error instanceof Error ? error.message : String(error),
                  },
                  { index }
                );
                updateEnrichedSongAtIndex(index, {
                  title,
                  artist,
                  found_on_spotify: false,
                });
                notify("spotify_progress", {
                  index,
                  status: "error",
                  song: enrichedSongs[index],
                });
              } finally {
                resolve();
              }
            });
          });

          pendingSpotifyMatches.push(promise);
        };

        const updateSongsFromOutput = (songs?: PlaylistGeneratorOutput["songs"]) => {
          if (!songs || songs.length === 0) {
            latestSongs = songs ?? [];
            return;
          }

          latestSongs = songs;
          if (enrichedSongs.length < songs.length) {
            enrichedSongs.length = songs.length;
          }

          songs.forEach((song, index) => {
            updateEnrichedSongAtIndex(index, {
              title: song?.title,
              artist: song?.artist,
              position: index + 1,
            });
            scheduleSpotifyMatch(index, song);
          });

          if (enrichedSongs.length > songs.length) {
            enrichedSongs = enrichedSongs.slice(0, songs.length);
          }

          for (const idx of Array.from(matchedSongIndices)) {
            if (idx >= songs.length) {
              matchedSongIndices.delete(idx);
            }
          }
        };

        const ensureEnrichedSongFallbacks = () => {
          if (!latestSongs || latestSongs.length === 0) {
            enrichedSongs = [];
            return;
          }

          enrichedSongs = latestSongs.map((song, index) => ({
            title: song?.title ?? enrichedSongs[index]?.title,
            artist: song?.artist ?? enrichedSongs[index]?.artist,
            spotify_id: enrichedSongs[index]?.spotify_id,
            album_name: enrichedSongs[index]?.album_name,
            album_art_url: enrichedSongs[index]?.album_art_url,
            duration_ms: enrichedSongs[index]?.duration_ms,
            preview_url: enrichedSongs[index]?.preview_url,
            external_url: enrichedSongs[index]?.external_url,
            found_on_spotify: enrichedSongs[index]?.found_on_spotify ?? false,
            position: index + 1,
          }));
        };

        // existingSnapshot already declared above
        if (playlistId) {
          existingSnapshot = await fetchPlaylistSnapshot(supabase, playlistId, user.id);
        }

        if (existingSnapshot?.playlist?.status === "published") {
          if (existingSnapshot.tracks.length > 0) {
            notify("ai_update", {
              output: {
                name: existingSnapshot.playlist.title,
                essay: existingSnapshot.playlist.description,
                songs: existingSnapshot.tracks.map((track) => ({
                  title: track.title,
                  artist: track.artist,
                })),
                categorization: existingSnapshot.metadata
                  ? [
                      {
                        primary_genre: existingSnapshot.metadata["primary_genre"] as
                          | string
                          | undefined,
                        subgenre: existingSnapshot.metadata["subgenre"] as
                          | string
                          | undefined,
                        mood: existingSnapshot.metadata["mood"] as
                          | string
                          | undefined,
                        years: existingSnapshot.metadata["years"] as
                          | string[]
                          | undefined,
                        energy_level: existingSnapshot.metadata["energy_level"] as
                          | string
                          | undefined,
                        tempo: existingSnapshot.metadata["tempo"] as
                          | string
                          | undefined,
                        dominant_instruments: existingSnapshot.metadata[
                          "dominant_instruments"
                        ] as string[] | undefined,
                        vocal_style: existingSnapshot.metadata["vocal_style"] as
                          | string
                          | undefined,
                        themes: existingSnapshot.metadata["themes"] as string[] | undefined,
                      },
                    ]
                  : undefined,
              },
            });
          }

          if (existingSnapshot.playlist.cover_art_url) {
            notify("cover_status", {
              stage: "success",
              cover_art_url: existingSnapshot.playlist.cover_art_url,
              cover_art_description: existingSnapshot.playlist.cover_art_description,
              metadata:
                (existingSnapshot.playlist.cover_art_metadata as Record<string, unknown>) ||
                null,
            });
          }

          notify("playlist_saved", {
            playlist_id: existingSnapshot.playlist.id,
            spotify_playlist_id: existingSnapshot.playlist.spotify_playlist_id || undefined,
          });

          emitDiagnostic("existing_playlist_snapshot", existingSnapshot);

          notify("status", {
            stage: "spotify_connection",
            connected: isSpotifyConnected && !!spotifyAccessToken,
          });

          const existingCompletePayload = {
            playlist: existingSnapshot.playlist,
            tracks: existingSnapshot.tracks,
            metadata: existingSnapshot.metadata,
            songs: existingSnapshot.tracks,
            spotify_connected: isSpotifyConnected && !!spotifyAccessToken,
            metrics: null,
          };

          notify("complete", existingCompletePayload);
          emitDiagnostic("complete_payload", existingCompletePayload);
          return;
        }

        const run = await playlistGeneratorAgent({ prompt }).stream();

        for await (const chunk of run.stream as AsyncIterable<
          RunStreamEvent<PlaylistGeneratorOutput>
        >) {
          if (chunk.data) {
            metrics = chunk.data as WorkflowMetrics;
          }

          if (chunk.output) {
            latestOutput = chunk.output as PlaylistGeneratorOutput;
            updateSongsFromOutput(
              (chunk.output as PlaylistGeneratorOutput).songs as
                | PlaylistGeneratorOutput["songs"]
                | undefined
            );
            notify("ai_update", { output: chunk.output });
            emitDiagnostic("workflow_ai_update", chunk.output);
          }
        }

        if (!latestOutput) {
          throw new Error("Playlist generator returned no output");
        }

        notify("status", {
          stage: "ai_complete",
          message: "IA finalizada. Buscando músicas no Spotify…",
        });
        emitDiagnostic("workflow_ai_complete", latestOutput);

        notify("status", {
          stage: "spotify_connection",
          connected: isSpotifyConnected && !!spotifyAccessToken,
        });

        await Promise.all(pendingSpotifyMatches);

        ensureEnrichedSongFallbacks();

        let spotifyPlaylistId: { id: string } | null = null;

        if (spotifyAccessToken && enrichedSongs.length > 0) {
          const foundSongs = enrichedSongs.filter(
            (song) => song.found_on_spotify && song.spotify_id
          );
          if (foundSongs.length > 0) {
            const currentUser = await getCurrentUser(spotifyAccessToken);
            if (currentUser) {
              emitDiagnostic("spotify_create_playlist_request", {
                user_id: currentUser.id,
                name: latestOutput.name || "Generated Playlist",
                description: latestOutput.essay || "AI-generated playlist",
                public: false,
              });
              spotifyPlaylistId = await createPlaylist(
                currentUser.id,
                latestOutput.name || "Generated Playlist",
                latestOutput.essay || "AI-generated playlist",
                spotifyAccessToken,
                false
              );
              emitDiagnostic("spotify_create_playlist_response", spotifyPlaylistId);

              const uris = foundSongs.map((song) => "spotify:track:" + song.spotify_id);
              emitDiagnostic("spotify_add_tracks_request", {
                playlist_id: spotifyPlaylistId.id,
                uris,
              });
              await addTracksToPlaylist(spotifyPlaylistId.id, uris, spotifyAccessToken);
              emitDiagnostic("spotify_add_tracks_response", {
                playlist_id: spotifyPlaylistId.id,
                added: uris.length,
              });
            }
          }
        } else if (isSpotifyConnected && !spotifyAccessToken && enrichedSongs.length > 0) {
          notify("spotify_progress", {
            status: "no_token",
            message: "Access token indisponível para enriquecer faixas",
          });
        }

        let playlistSnapshot = await savePlaylistData({
          supabase,
          prompt,
          playlistId,
          userId: user.id,
          output: latestOutput,
          songs: enrichedSongs,
          spotifyPlaylistId,
        });

        if (playlistSnapshot) {
          emitDiagnostic("playlist_saved_snapshot", playlistSnapshot);
        }

        notify("playlist_saved", {
          playlist_id: playlistSnapshot?.playlist?.id,
          spotify_playlist_id: spotifyPlaylistId?.id,
        });

        if (playlistSnapshot?.playlist) {
          const songList = enrichedSongs
            .map((song) => (song.artist || "") + " - " + (song.title || ""))
            .join("; ");

          await generatePlaylistCover(
            playlistSnapshot.playlist.title || latestOutput.name || "",
            playlistSnapshot.playlist.description || latestOutput.essay || "",
            songList,
            supabase,
            playlistSnapshot.playlist.id,
            {
              onStatus: (status: CoverGenerationStatus) => {
                if (status.stage === "started") {
                  notify("cover_status", { stage: "started" });
                } else if (status.stage === "success") {
                  notify("cover_status", {
                    stage: "success",
                    cover_art_url: status.coverArtUrl,
                    cover_art_description: status.coverArtDescription,
                    metadata: status.metadata,
                  });
                } else if (status.stage === "error") {
                  notify("cover_status", {
                    stage: "error",
                    message: status.message,
                  });
                }
              },
            }
          );

          playlistSnapshot =
            (await fetchPlaylistSnapshot(
              supabase,
              playlistSnapshot.playlist.id,
              user.id
            )) || playlistSnapshot;
        }

        const completePayload = {
          playlist: playlistSnapshot?.playlist || latestOutput,
          tracks: playlistSnapshot?.tracks || enrichedSongs,
          metadata: playlistSnapshot?.metadata || null,
          songs: enrichedSongs,
          spotify_connected: isSpotifyConnected && !!spotifyAccessToken,
          metrics,
        };

        notify("complete", completePayload);
        emitDiagnostic("complete_payload", completePayload);
      } catch (error) {
        console.error("Streaming playlist generation error", error);
        emitDiagnostic("error", {
          message: error instanceof Error ? error.message : String(error),
        });
        notify("error", {
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export const dynamic = "force-dynamic";
