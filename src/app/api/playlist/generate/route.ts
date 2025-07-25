import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  playlistGeneratorAgent,
  PlaylistGeneratorInput,
} from "@/lib/workflowai/agents";
import { searchTracks } from "@/lib/spotify/api";
import { SpotifyService } from "@/lib/services/spotify";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

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
        const enrichedSongs = [];
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
                
                // Only accept matches with a minimum score (artist match is most important)
                if (bestScore >= 2) {
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
    
    return NextResponse.json({ 
      playlist: output, 
      metrics: data,
      spotify_connected: isSpotifyConnected 
    });
  } catch (error) {
    console.error("Playlist generation error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 