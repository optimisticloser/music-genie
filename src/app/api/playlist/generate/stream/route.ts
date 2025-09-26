import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { RunStreamEvent } from "@workflowai/workflowai";
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
import { generatePlaylistCover } from "@/lib/services/workflowai";

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
}

interface StreamEventPayload {
  [key: string]: unknown;
}

type StreamEventName =
  | "status"
  | "ai_update"
  | "spotify_progress"
  | "playlist_saved"
  | "complete"
  | "error";

const encoder = new TextEncoder();

function enqueueEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: StreamEventName,
  payload: StreamEventPayload
) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  controller.enqueue(encoder.encode(data));
}

async function enrichSongsWithSpotify(
  songs: PlaylistGeneratorOutput["songs"],
  accessToken: string,
  notify: (payload: StreamEventPayload) => void
): Promise<EnrichedSong[]> {
  if (!songs || songs.length === 0) {
    return [];
  }

  const normalizedSongs: EnrichedSong[] = songs.map((song) => ({
    title: song.title?.trim(),
    artist: song.artist?.trim(),
    found_on_spotify: false,
  }));

  const results: EnrichedSong[] = new Array(normalizedSongs.length);
  const concurrency = Math.min(3, normalizedSongs.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= normalizedSongs.length) {
        break;
      }

      const song = normalizedSongs[currentIndex];
      if (!song.title || !song.artist) {
        results[currentIndex] = { ...song, found_on_spotify: false };
        notify({ index: currentIndex, status: "skipped", song });
        continue;
      }

      notify({ index: currentIndex, status: "searching", song });

      try {
        const searchQuery = `${song.artist} ${song.title}`;
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          results[currentIndex] = { ...song, found_on_spotify: false };
          notify({ index: currentIndex, status: "not_found", song });
          continue;
        }

        const searchData = await response.json();
        const track = searchData.tracks?.items?.[0];
        if (!track) {
          results[currentIndex] = { ...song, found_on_spotify: false };
          notify({ index: currentIndex, status: "not_found", song });
          continue;
        }

        const enriched: EnrichedSong = {
          ...song,
          spotify_id: track.id,
          album_name: track.album?.name,
          album_art_url: track.album?.images?.[0]?.url,
          duration_ms: track.duration_ms,
          preview_url: track.preview_url,
          external_url: track.external_urls?.spotify,
          found_on_spotify: true,
        };

        results[currentIndex] = enriched;
        notify({ index: currentIndex, status: "found", song: enriched });
      } catch (error) {
        console.error("Spotify search error", error);
        results[currentIndex] = { ...song, found_on_spotify: false };
        notify({ index: currentIndex, status: "error", song });
      }
    }
  };

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);

  return results;
}

function calculateTotalDuration(songs: EnrichedSong[]): number {
  return songs.reduce((total, song) => total + (song.duration_ms || 0), 0);
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
}) {
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
        spotify_playlist_id: spotifyPlaylistId,
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

    const { data: playlist } = await supabase
      .from("playlists")
      .select()
      .eq("id", playlistId)
      .single();

    return playlist;
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
      spotify_playlist_id: spotifyPlaylistId,
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

  return created;
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const notify = (event: StreamEventName, payload: StreamEventPayload) =>
        enqueueEvent(controller, event, payload);

      try {
        notify("status", {
          stage: "starting",
          message: "Preparando geração da playlist…",
        });

        const run = await playlistGeneratorAgent({ prompt }).stream();

        let latestOutput: PlaylistGeneratorOutput | null = null;
        let metrics: WorkflowMetrics = null;

        for await (const chunk of run.stream as AsyncIterable<
          RunStreamEvent<PlaylistGeneratorOutput>
        >) {
          if (chunk.data) {
            metrics = chunk.data as WorkflowMetrics;
          }

          if (chunk.output) {
            latestOutput = chunk.output as PlaylistGeneratorOutput;
            notify("ai_update", { output: chunk.output });
          }
        }

        if (!latestOutput) {
          throw new Error("Playlist generator returned no output");
        }

        notify("status", {
          stage: "ai_complete",
          message: "IA finalizada. Buscando músicas no Spotify…",
        });

        const isSpotifyConnected = await SpotifyService.isSpotifyConnected(user.id);
        notify("status", {
          stage: "spotify_connection",
          connected: isSpotifyConnected,
        });

        let enrichedSongs: EnrichedSong[] = (latestOutput.songs || []).map(
          (song) => ({
            title: song.title,
            artist: song.artist,
            found_on_spotify: false,
          })
        );
        let spotifyPlaylistId: { id: string } | null = null;

        if (isSpotifyConnected && latestOutput.songs && latestOutput.songs.length > 0) {
          const accessToken = await SpotifyService.getValidAccessToken(user.id);

          if (accessToken) {
            enrichedSongs = await enrichSongsWithSpotify(
              latestOutput.songs,
              accessToken,
              (payload) => notify("spotify_progress", payload)
            );

            const foundSongs = enrichedSongs.filter((song) => song.found_on_spotify);
            if (foundSongs.length > 0) {
              const currentUser = await getCurrentUser(accessToken);
              if (currentUser) {
                spotifyPlaylistId = await createPlaylist(
                  currentUser.id,
                  latestOutput.name || "Generated Playlist",
                  latestOutput.essay || "AI-generated playlist",
                  accessToken,
                  false
                );

                const uris = foundSongs.map((song) => `spotify:track:${song.spotify_id}`);
                await addTracksToPlaylist(spotifyPlaylistId.id, uris, accessToken);
              }
            }
          } else {
            notify("spotify_progress", {
              status: "no_token",
              message: "Access token indisponível para enriquecer faixas",
            });
          }
        }

        const playlistRecord = await savePlaylistData({
          supabase,
          prompt,
          playlistId,
          userId: user.id,
          output: latestOutput,
          songs: enrichedSongs,
          spotifyPlaylistId,
        });

        notify("playlist_saved", {
          playlist_id: playlistRecord?.id,
          spotify_playlist_id: spotifyPlaylistId?.id,
        });

        if (playlistRecord) {
          const songList = enrichedSongs
            .map((song) => `${song.artist || ""} - ${song.title || ""}`)
            .join("; ");

          generatePlaylistCover(
            playlistRecord.title || latestOutput.name || "",
            playlistRecord.description || latestOutput.essay || "",
            songList,
            supabase,
            playlistRecord.id
          ).catch((error: Error) => {
            console.error("Async cover generation failed", error);
          });
        }

        notify("complete", {
          playlist: playlistRecord || latestOutput,
          spotify_connected: isSpotifyConnected,
          metrics,
        });
      } catch (error) {
        console.error("Streaming playlist generation error", error);
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
