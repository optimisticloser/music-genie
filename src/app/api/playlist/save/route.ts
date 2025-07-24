import { NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

interface Song {
  title?: string;
  artist?: string;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { playlist, prompt } = body;

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

    // Create playlist
    const { data: savedPlaylist, error: playlistError } = await supabase
      .from("playlists")
      .insert({
        lineage_id: lineage.id,
        user_id: user.id,
        title: playlist.name || "Generated Playlist",
        description: playlist.essay,
        prompt: prompt,
        version: 1,
        status: "draft",
        sharing_permission: "private",
        total_tracks: playlist.songs?.length || 0,
        total_duration_ms: 0, // TODO: Calculate from Spotify API
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
        title: song.title || "Unknown",
        artist: song.artist || "Unknown",
        album: "Generated",
        duration_ms: 0, // TODO: Get from Spotify API
        track_number: index + 1,
        spotify_track_id: null, // TODO: Search and match
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
      message: "Playlist saved successfully" 
    });

  } catch (error) {
    console.error("Save playlist error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 