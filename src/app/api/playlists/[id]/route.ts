import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const playlistId = resolvedParams.id;

    // Get playlist details
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select(`
        id,
        title,
        description,
        prompt,
        status,
        total_tracks,
        total_duration_ms,
        spotify_playlist_id,
        created_at,
        updated_at,
        users!inner (
          id,
          full_name,
          email
        )
      `)
      .eq('id', playlistId)
      .eq('user_id', user.id) // Ensure user can only access their own playlists
      .single();

    if (playlistError || !playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Get playlist tracks
    const { data: tracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        id,
        spotify_track_id,
        track_name,
        artist_name,
        album_name,
        album_art_url,
        duration_ms,
        preview_url,
        position,
        found_on_spotify
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (tracksError) {
      console.error("Error fetching playlist tracks:", tracksError);
      return NextResponse.json({ error: "Failed to fetch playlist tracks" }, { status: 500 });
    }

    // Format the response
    const formattedPlaylist = {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      prompt: playlist.prompt,
      status: playlist.status,
      creator: playlist.users.full_name || playlist.users.email,
      total_tracks: playlist.total_tracks,
      duration: formatDuration(playlist.total_duration_ms || 0),
      spotify_playlist_id: playlist.spotify_playlist_id,
      gradient: generateGradient(playlist.id),
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
      tracks: tracks?.map(track => ({
        id: track.id,
        title: track.track_name,
        artist: track.artist_name,
        album: track.album_name,
        artwork: track.album_art_url,
        duration: formatTrackDuration(track.duration_ms || 0),
        preview_url: track.preview_url,
        spotify_id: track.spotify_track_id,
        found_on_spotify: track.found_on_spotify,
        position: track.position
      })) || []
    };

    return NextResponse.json({ playlist: formattedPlaylist });

  } catch (error) {
    console.error("Get playlist details error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Helper function to format duration from milliseconds
function formatDuration(durationMs: number): string {
  if (!durationMs) return '0m';
  
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m`;
}

// Helper function to format track duration
function formatTrackDuration(durationMs: number): string {
  if (!durationMs) return '0:00';
  
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to generate consistent gradient based on playlist ID
function generateGradient(playlistId: string): string {
  const gradients = [
    'from-blue-400 to-purple-600',
    'from-green-400 to-blue-600',
    'from-red-400 to-orange-600',
    'from-purple-400 to-pink-600',
    'from-yellow-400 to-red-600',
    'from-indigo-400 to-purple-600',
    'from-pink-400 to-rose-600',
    'from-teal-400 to-cyan-600',
    'from-orange-400 to-yellow-600',
    'from-violet-400 to-purple-600',
  ];
  
  // Use playlist ID to consistently generate the same gradient
  let hash = 0;
  for (let i = 0; i < playlistId.length; i++) {
    const char = playlistId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
} 