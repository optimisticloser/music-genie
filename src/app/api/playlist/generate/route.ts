import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { playlistGeneratorAgent, PlaylistGeneratorInput } from "@/lib/workflowai/agents";
import { SpotifyService } from "@/lib/services/spotify";
import { createPlaylist, addTracksToPlaylist, getCurrentUser } from "@/lib/spotify/api";
import { generatePlaylistCover } from "@/lib/services/workflowai";

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
        // Enrich songs with Spotify data
        for (let i = 0; i < output.songs.length; i++) {
          const song = output.songs[i];
          if (song.title && song.artist) {
            try {
              console.log(`🎵 Searching for: ${song.artist} - ${song.title}`);
              
              const searchQuery = `${song.artist} ${song.title}`;
              const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              );

              if (response.ok) {
                const searchData = await response.json();
                const tracks = searchData.tracks?.items;
                
                if (tracks && tracks.length > 0) {
                  const track = tracks[0];
                  console.log(`✅ Found on Spotify: ${track.name} by ${track.artists[0].name}`);
                  
                  // Update song with Spotify data
                  (output.songs[i] as EnrichedSong) = {
                    ...song,
                    spotify_id: track.id,
                    album_name: track.album.name,
                    album_art_url: track.album.images[0]?.url,
                    duration_ms: track.duration_ms,
                    preview_url: track.preview_url,
                    external_url: track.external_urls.spotify,
                    found_on_spotify: true,
                  };
                } else {
                  console.log(`❌ Not found on Spotify: ${song.artist} - ${song.title}`);
                  (output.songs[i] as EnrichedSong) = {
                    ...song,
                    found_on_spotify: false,
                  };
                }
              } else {
                console.log(`❌ Spotify search failed for: ${song.artist} - ${song.title}`);
                (output.songs[i] as EnrichedSong) = {
                  ...song,
                  found_on_spotify: false,
                };
              }
            } catch (error) {
              console.error(`❌ Error searching Spotify for ${song.artist} - ${song.title}:`, error);
              (output.songs[i] as EnrichedSong) = {
                ...song,
                found_on_spotify: false,
              };
            }
          }
        }
      }
    }

    console.log("🎵 Final response - Total songs:", output.songs?.length || 0);
    
    // Calculate total duration from enriched songs
    const totalDurationMs = (output.songs as EnrichedSong[])?.reduce((total, song) => 
      total + (song.duration_ms || 0), 0) || 0;
    
    // Create Spotify playlist if connected and songs found
    let spotifyPlaylistId = null;
    if (isSpotifyConnected && output.songs && output.songs.length > 0) {
      const accessToken = await SpotifyService.getValidAccessToken(user.id);
      if (accessToken) {
        try {
          const foundSongs = (output.songs as EnrichedSong[]).filter((song) => song.found_on_spotify);
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
              const trackUris = foundSongs.map((song) => `spotify:track:${song.spotify_id}`);
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
        const tracksToInsert = (output.songs as EnrichedSong[]).map((song, index: number) => ({
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

      // Save metadata if available
      if (output.categorization && output.categorization.length > 0) {
        const categorization = output.categorization[0]; // Take the first categorization
        console.log("📊 Saving playlist metadata:", categorization);
        
        const { error: metadataError } = await supabase
          .from('playlist_metadata')
          .upsert({
            playlist_id: playlist_id,
            primary_genre: categorization.primary_genre,
            subgenre: categorization.subgenre,
            mood: categorization.mood,
            years: categorization.years,
            energy_level: categorization.energy_level,
            tempo: categorization.tempo,
            dominant_instruments: categorization.dominant_instruments,
            vocal_style: categorization.vocal_style,
            themes: categorization.themes,
          }, {
            onConflict: 'playlist_id'
          });

        if (metadataError) {
          console.error('Error saving metadata:', metadataError);
        } else {
          console.log('✅ Saved playlist metadata');
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
        const tracksToInsert = (output.songs as EnrichedSong[]).map((song, index: number) => ({
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

      // Save metadata if available (legacy path)
      if (output.categorization && output.categorization.length > 0 && created) {
        const categorization = output.categorization[0]; // Take the first categorization
        console.log("📊 Saving playlist metadata:", categorization);
        
        const { error: metadataError } = await supabase
          .from('playlist_metadata')
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
          console.error('Error saving metadata:', metadataError);
        } else {
          console.log('✅ Saved playlist metadata');
        }
      }
    }

    // Gerar capa de playlist de forma assíncrona após a playlist ser criada
    if (savedPlaylist) {
      const songList = (output.songs as EnrichedSong[])?.map(song => `${song.artist} - ${song.title}`).join('; ') || '';
      
      // Iniciar geração da capa de forma assíncrona (não aguardar)
      generatePlaylistCover(
        savedPlaylist.title || output.name || '',
        savedPlaylist.description || output.essay || '',
        songList,
        supabase,
        savedPlaylist.id
      ).catch((error: Error) => {
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
    console.error("Playlist generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 