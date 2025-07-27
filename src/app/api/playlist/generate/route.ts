import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  playlistGeneratorAgent,
  PlaylistGeneratorInput,
  playlistCoverArtGeneration,
  PlaylistCoverArtGenerationInput,
} from "@/lib/workflowai/agents";
import { searchTracks, createPlaylist, addTracksToPlaylist, getCurrentUser } from "@/lib/spotify/api";
import { SpotifyService } from "@/lib/services/spotify";

// Função para gerar capa de playlist de forma assíncrona
async function generatePlaylistCover(
  playlistName: string,
  playlistDescription: string,
  songList: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  playlistId: string
) {
  try {
    console.log("🎨 Starting async cover art generation for playlist:", playlistId);
    
    const input: PlaylistCoverArtGenerationInput = {
      playlist_name: playlistName,
      playlist_description: playlistDescription,
      song_list: songList,
      style_preferences: "Bright, energetic, vibrant",
      color_preferences: "Vibrant yellows, energetic oranges, and bright magentas",
    };

    const {
      output,
      data: { duration_seconds, cost_usd, version },
    } = await playlistCoverArtGeneration(input);

    if (output?.cover_art) {
      console.log("✅ Cover art generated successfully:", {
        playlistId,
        coverArtUrl: output.cover_art.url,
        model: version?.properties?.model,
        cost: cost_usd,
        latency: duration_seconds?.toFixed(2),
      });

      // Atualizar a playlist com a URL da capa gerada
      const { error: updateError } = await supabase
        .from("playlists")
        .update({
          cover_art_url: output.cover_art.url,
          cover_art_description: output.design_description,
          cover_art_metadata: {
            model: version?.properties?.model,
            cost_usd: cost_usd,
            duration_seconds: duration_seconds,
            generated_at: new Date().toISOString(),
          },
        })
        .eq("id", playlistId);

      if (updateError) {
        console.error("❌ Error updating playlist with cover art:", updateError);
      } else {
        console.log("✅ Playlist updated with cover art URL");
      }
    }
  } catch (error) {
    console.error("❌ Error generating cover art:", error);
    // Não falha a geração da playlist se a capa falhar
  }
}

export async function POST(req: NextRequest) {
  console.log("🚀 Starting playlist generation...");
  console.log("📋 Request method:", req.method);
  console.log("📋 Request headers:", Object.fromEntries(req.headers.entries()));
  console.log("📋 Request URL:", req.url);
  
  try {
    // Get user session
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
              console.error("Error setting cookies:", error);
            }
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
      console.log("📦 Request body received:", body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { prompt, playlist_id } = body;

    if (!prompt) {
      console.error("❌ No prompt provided");
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    console.log("🎯 Processing playlist_id:", playlist_id);

    // Generate playlist with WorkflowAI
    const input: PlaylistGeneratorInput = {
      prompt: prompt,
    };

    const { output, data } = await playlistGeneratorAgent(input);

    // If user has Spotify connected, search for tracks
    const isSpotifyConnected = await SpotifyService.isSpotifyConnected(user.id);
    console.log("🎵 Spotify connected:", isSpotifyConnected);
    
    if (isSpotifyConnected && output.songs && output.songs.length > 0) {
      console.log("🎵 Enriching songs with Spotify data...");
      const accessToken = await SpotifyService.getValidAccessToken(user.id);
      
      if (accessToken) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedSongs: Array<any> = [];
        let foundCount = 0;
        
        for (const song of output.songs) {
          if (song.title && song.artist) {
            try {
              // Use a more specific search query with quotes for exact matches
              const searchQuery = `track:"${song.title}" artist:"${song.artist}"`;
              console.log(`🎵 Searching for: ${searchQuery}`);
              const tracks = await searchTracks(searchQuery, accessToken, 5); // Get more results to find better matches
              
              if (tracks.length > 0) {
                // Find the best match by comparing artist names
                let bestTrack = tracks[0];
                let bestScore = 0;
                
                for (const track of tracks) {
                  const artistMatch = track.artists.some(artist => 
                    artist.name.toLowerCase().includes(song.artist!.toLowerCase()) ||
                    song.artist!.toLowerCase().includes(artist.name.toLowerCase())
                  );
                  
                  const titleMatch = track.name.toLowerCase().includes(song.title!.toLowerCase()) ||
                    song.title!.toLowerCase().includes(track.name.toLowerCase());
                  
                  const score = (artistMatch ? 2 : 0) + (titleMatch ? 1 : 0);
                  
                  if (score > bestScore) {
                    bestScore = score;
                    bestTrack = track;
                  }
                }
                
                console.log(`🎵 Best match found: ${bestTrack.name} by ${bestTrack.artists[0].name} (score: ${bestScore})`);
                console.log(`🎵 Original: ${song.title} by ${song.artist}`);
                
                // Accept matches with a lower threshold to get more preview URLs
                if (bestScore >= 1) { // Reduced from 2 to 1 to be less restrictive
                  console.log(`🎵 Accepting match with score ${bestScore} for preview URL`);
                  enrichedSongs.push({
                    ...song,
                    spotify_id: bestTrack.id,
                    album_name: bestTrack.album.name,
                    album_art_url: bestTrack.album.images[0]?.url,
                    duration_ms: bestTrack.duration_ms,
                    preview_url: bestTrack.preview_url,
                    external_url: bestTrack.external_urls.spotify,
                    found_on_spotify: true
                  });
                  foundCount++;
                } else {
                  console.log(`🎵 Match score too low (${bestScore}), marking as not found`);
                  enrichedSongs.push({
                    ...song,
                    found_on_spotify: false
                  });
                }
              } else {
                console.log(`🎵 Not found: ${song.title} by ${song.artist}`);
                enrichedSongs.push({
                  ...song,
                  found_on_spotify: false
                });
              }
            } catch (error) {
              console.error(`❌ Error searching for track ${song.title}:`, error);
              enrichedSongs.push({
                ...song,
                found_on_spotify: false
              });
            }
          }
        }
        
        console.log(`🎵 Spotify enrichment complete: ${foundCount}/${output.songs.length} tracks found`);
        output.songs = enrichedSongs;
      } else {
        console.log("🎵 No access token available for Spotify search");
      }
    } else {
      console.log("🎵 Spotify not connected or no songs to enrich");
    }

    console.log("🎵 Final response - Spotify connected:", isSpotifyConnected);
    console.log("🎵 Final response - Total songs:", output.songs?.length || 0);
    
    // Calculate total duration from enriched songs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalDurationMs = output.songs?.reduce((total, song: any) => 
      total + (song.duration_ms || 0), 0) || 0;
    
    // Create Spotify playlist if connected and songs found
    let spotifyPlaylistId = null;
    if (isSpotifyConnected && output.songs && output.songs.length > 0) {
      const accessToken = await SpotifyService.getValidAccessToken(user.id);
      if (accessToken) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const foundSongs = output.songs.filter((song: any) => song.found_on_spotify);
          if (foundSongs.length > 0) {
            // Get current user to get Spotify user ID
            const currentUser = await getCurrentUser(accessToken);
            if (currentUser) {
              spotifyPlaylistId = await createPlaylist(
                currentUser.id,
                output.name || 'Generated Playlist',
                output.essay || 'AI-generated playlist',
                accessToken,
                false
              );
              
              // Add tracks to the playlist
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const trackUris = foundSongs.map((song: any) => `spotify:track:${song.spotify_id}`);
              await addTracksToPlaylist(spotifyPlaylistId.id, trackUris, accessToken);
            }
          }
        } catch (error) {
          console.error("Error creating Spotify playlist:", error);
        }
      }
    }
    
    let savedPlaylist;
    if (playlist_id) {
      // update existing draft
      const { data: updated, error: updErr } = await supabase
        .from('playlists')
        .update({
          title: output.name,
          description: output.essay,
          status: 'published',
          total_tracks: output.songs?.length || 0,
          total_duration_ms: totalDurationMs,
          spotify_playlist_id: spotifyPlaylistId,
        })
        .eq('id', playlist_id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (updErr) {
        console.error('Update playlist error', updErr);
      }
      savedPlaylist = updated;

      // Save tracks to playlist_tracks table
      if (output.songs && output.songs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tracksToInsert = output.songs.map((song: any, index: number) => ({
          playlist_id: playlist_id,
          spotify_track_id: song.spotify_id || `not_found_${index}`,
          track_name: song.title || '',
          artist_name: song.artist || '',
          album_name: song.album_name || '',
          album_art_url: song.album_art_url || null,
          duration_ms: song.duration_ms || 0,
          preview_url: song.preview_url || null,
          position: index + 1,
          found_on_spotify: song.found_on_spotify || false,
        }));

        const { error: tracksError } = await supabase
          .from('playlist_tracks')
          .insert(tracksToInsert);

        if (tracksError) {
          console.error('Error saving tracks:', tracksError);
        } else {
          console.log(`✅ Saved ${tracksToInsert.length} tracks to playlist_tracks`);
        }
      }
    } else {
      // Create playlist lineage first
      const { data: lineage, error: lineageError } = await supabase
        .from("playlist_lineage")
        .insert({
          original_prompt: prompt,
          user_id: user.id,
        })
        .select()
        .single();

      if (lineageError) {
        console.error("Error creating lineage:", lineageError);
        return NextResponse.json({ error: "Failed to create playlist lineage" }, { status: 500 });
      }

      // Create playlist in database (legacy path)
      const { data: created, error: playlistError } = await supabase
        .from("playlists")
        .insert({
          lineage_id: lineage.id,
          user_id: user.id,
          title: output.name,
          description: output.essay,
          prompt: prompt,
          version: 1,
          status: "published",
          sharing_permission: "private",
          spotify_playlist_id: spotifyPlaylistId,
          total_tracks: output.songs?.length || 0,
          total_duration_ms: totalDurationMs,
        })
        .select()
        .single();
      savedPlaylist = created;
      if (playlistError) {
        console.error("Playlist creation error:", playlistError);
      }

      // Save tracks to playlist_tracks table (legacy path)
      if (output.songs && output.songs.length > 0 && created) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tracksToInsert = output.songs.map((song: any, index: number) => ({
          playlist_id: created.id,
          spotify_track_id: song.spotify_id || `not_found_${index}`,
          track_name: song.title || '',
          artist_name: song.artist || '',
          album_name: song.album_name || '',
          album_art_url: song.album_art_url || null,
          duration_ms: song.duration_ms || 0,
          preview_url: song.preview_url || null,
          position: index + 1,
          found_on_spotify: song.found_on_spotify || false,
        }));

        const { error: tracksError } = await supabase
          .from('playlist_tracks')
          .insert(tracksToInsert);

        if (tracksError) {
          console.error('Error saving tracks:', tracksError);
        } else {
          console.log(`✅ Saved ${tracksToInsert.length} tracks to playlist_tracks`);
        }
      }
    }

    // Gerar capa de playlist de forma assíncrona após a playlist ser criada
    if (savedPlaylist) {
      const songList = output.songs?.map(song => `${song.artist} - ${song.title}`).join('; ') || '';
      
      // Iniciar geração da capa de forma assíncrona (não aguardar)
      generatePlaylistCover(
        savedPlaylist.title || output.name || '',
        savedPlaylist.description || output.essay || '',
        songList,
        supabase,
        savedPlaylist.id
      ).catch(error => {
        console.error("❌ Async cover generation failed:", error);
      });
    }

    return NextResponse.json({ 
      playlist: savedPlaylist || output, 
      metrics: data,
      spotify_connected: isSpotifyConnected,
      cover_generation_started: !!savedPlaylist
    });
  } catch (error) {
    console.error("Playlist generation error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 