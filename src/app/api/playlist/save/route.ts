import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";
import { SpotifyService } from "@/lib/services/spotify";
import { createPlaylist, addTracksToPlaylist, getCurrentUser } from "@/lib/spotify/api";

interface Song {
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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { playlist, prompt } = body;

    if (!playlist || !playlist.name) {
      return NextResponse.json({ error: "Playlist data is required" }, { status: 400 });
    }

    // Create playlist lineage
    const { data: lineage, error: lineageError } = await supabase
      .from("playlist_lineage")
      .insert({
        user_id: user.id,
        original_prompt: prompt,
      })
      .select()
      .single();

    if (lineageError) {
      console.error("Lineage creation error:", lineageError);
      return new NextResponse("Failed to create playlist lineage", { status: 500 });
    }

    // Check if user has Spotify connected
    const isSpotifyConnected = await SpotifyService.isSpotifyConnected(user.id);
    console.log("🎵 User Spotify connection status:", isSpotifyConnected);
    let spotifyPlaylistId: string | null = null;
    let spotifyPlaylistUrl: string | null = null;

    // Create playlist on Spotify if connected
    if (isSpotifyConnected && playlist.songs && playlist.songs.length > 0) {
      console.log("🎵 Creating Spotify playlist for user:", user.id);
      console.log("🎵 Playlist name:", playlist.name);
      console.log("🎵 Number of songs:", playlist.songs.length);
      console.log("🎵 Songs with Spotify ID:", playlist.songs.filter((s: Song) => s.spotify_id).length);
      
      try {
        const accessToken = await SpotifyService.getValidAccessToken(user.id);
        console.log("🎵 Access token obtained:", !!accessToken);
        
        if (accessToken) {
          const spotifyUser = await getCurrentUser(accessToken);
          console.log("🎵 Spotify user:", spotifyUser.display_name);
          
          const spotifyPlaylist = await createPlaylist(
            spotifyUser.id,
            playlist.name,
            playlist.essay || `Playlist gerada por IA: ${playlist.name}`,
            accessToken,
            false // private playlist
          );
          
          console.log("🎵 Spotify playlist created:", spotifyPlaylist.id);
          console.log("🎵 Spotify playlist URL:", spotifyPlaylist.external_url);
          
          spotifyPlaylistId = spotifyPlaylist.id;
          spotifyPlaylistUrl = spotifyPlaylist.external_url;

          // Add tracks to Spotify playlist
          const tracksWithSpotifyId = playlist.songs.filter((song: Song) => song.spotify_id);
          console.log("🎵 Tracks with Spotify ID:", tracksWithSpotifyId.length);
          
          if (tracksWithSpotifyId.length > 0) {
            const trackUris = tracksWithSpotifyId.map((song: Song) => `spotify:track:${song.spotify_id}`);
            console.log("🎵 Adding tracks to Spotify playlist:", trackUris.length);
            await addTracksToPlaylist(spotifyPlaylistId, trackUris, accessToken);
            console.log("🎵 Tracks added successfully to Spotify");
          } else {
            console.log("🎵 No tracks with Spotify ID found");
          }
        } else {
          console.log("🎵 No access token available");
        }
      } catch (error) {
        console.error("❌ Error creating Spotify playlist:", error);
        // Continue without Spotify integration
      }
    } else {
      console.log("🎵 Spotify not connected or no songs available");
      console.log("🎵 Spotify connected:", isSpotifyConnected);
      console.log("🎵 Songs available:", playlist.songs?.length || 0);
      console.log("🎵 Will NOT attempt Spotify integration");
    }

    // Calculate total duration
    const totalDurationMs = playlist.songs?.reduce((total: number, song: Song) => {
      return total + (song.duration_ms || 0);
    }, 0) || 0;

    // Create playlist in database
    const { data: savedPlaylist, error: playlistError } = await supabase
      .from("playlists")
      .insert({
        lineage_id: lineage.id,
        user_id: user.id,
        title: playlist.name,
        description: playlist.essay,
        prompt: prompt,
        version: 1,
        status: "draft",
        sharing_permission: "private",
        spotify_playlist_id: spotifyPlaylistId,
        total_tracks: playlist.songs?.length || 0,
        total_duration_ms: totalDurationMs,
      })
      .select()
      .single();

    if (playlistError) {
      console.error("Playlist creation error:", playlistError);
      return new NextResponse("Failed to create playlist", { status: 500 });
    }

    // Save tracks if available
    if (playlist.songs && playlist.songs.length > 0) {
      const tracks = playlist.songs.map((song: Song, index: number) => ({
        playlist_id: savedPlaylist.id,
        spotify_track_id: song.spotify_id || "not_found", // Use a placeholder instead of null
        track_name: song.title || "Unknown",
        artist_name: song.artist || "Unknown",
        album_name: song.album_name || "Generated",
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
        console.error("Tracks creation error:", tracksError);
        // Don't fail the whole request if tracks fail
      }
    }

    return NextResponse.json({ 
      playlist: savedPlaylist,
      spotify_playlist_url: spotifyPlaylistUrl,
      message: "Playlist saved successfully" 
    });

  } catch (error) {
    console.error("Save playlist error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 