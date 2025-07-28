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

    // Get playlist details with metadata
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
        viewed_at,
        cover_art_url,
        cover_art_description,
        users!inner (
          id,
          full_name,
          email
        ),
        playlist_metadata (
          id,
          primary_genre,
          subgenre,
          mood,
          years,
          energy_level,
          tempo,
          dominant_instruments,
          vocal_style,
          themes,
          bpm_range,
          key_signature,
          language,
          cultural_influence
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
      viewed_at: playlist.viewed_at,
      cover_art_url: playlist.cover_art_url,
      cover_art_description: playlist.cover_art_description,
      metadata: playlist.playlist_metadata,
      tracks: tracks?.map(track => {
        console.log('🎵 Track data:', {
          id: track.id,
          title: track.track_name,
          artist: track.artist_name,
          album: track.album_name,
          artwork: track.album_art_url,
          preview_url: track.preview_url,
          found_on_spotify: track.found_on_spotify
        });
        
        return {
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
        };
      }) || []
    };

    return NextResponse.json({ playlist: formattedPlaylist });

  } catch (error) {
    console.error("Get playlist details error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTrackDuration(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function generateGradient(id: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-yellow-500 to-orange-500',
  ];
  
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
} 