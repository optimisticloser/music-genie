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
    
    if (isSpotifyConnected && output.songs && output.songs.length > 0) {
      const accessToken = await SpotifyService.getValidAccessToken(user.id);
      
      if (accessToken) {
        const enrichedSongs = [];
        
        for (const song of output.songs) {
          if (song.title && song.artist) {
            try {
              const searchQuery = `${song.title} ${song.artist}`;
              const tracks = await searchTracks(searchQuery, accessToken, 1);
              
              if (tracks.length > 0) {
                const track = tracks[0];
                enrichedSongs.push({
                  ...song,
                  spotify_id: track.id,
                  album_name: track.album.name,
                  album_art_url: track.album.images[0]?.url,
                  duration_ms: track.duration_ms,
                  preview_url: track.preview_url,
                  external_url: track.external_urls.spotify,
                  found_on_spotify: true
                });
              } else {
                enrichedSongs.push({
                  ...song,
                  found_on_spotify: false
                });
              }
            } catch (error) {
              console.error(`Error searching for track ${song.title}:`, error);
              enrichedSongs.push({
                ...song,
                found_on_spotify: false
              });
            }
          }
        }
        
        output.songs = enrichedSongs;
      }
    }

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