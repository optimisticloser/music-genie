import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const genre = searchParams.get('genre');
    const mood = searchParams.get('mood');
    const energy = searchParams.get('energy');
    const instruments = searchParams.get('instruments')?.split(',');
    const themes = searchParams.get('themes')?.split(',');
    const years = searchParams.get('years')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query
    let query = supabase
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
        playlist_metadata (
          primary_genre,
          subgenre,
          mood,
          years,
          energy_level,
          tempo,
          dominant_instruments,
          vocal_style,
          themes
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'published');

    // Apply filters
    if (genre) {
      query = query.eq('playlist_metadata.primary_genre', genre);
    }
    if (mood) {
      query = query.eq('playlist_metadata.mood', mood);
    }
    if (energy) {
      query = query.eq('playlist_metadata.energy_level', energy);
    }
    if (instruments && instruments.length > 0) {
      query = query.overlaps('playlist_metadata.dominant_instruments', instruments);
    }
    if (themes && themes.length > 0) {
      query = query.overlaps('playlist_metadata.themes', themes);
    }
    if (years && years.length > 0) {
      query = query.overlaps('playlist_metadata.years', years);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: playlists, error } = await query;

    if (error) {
      console.error("Error searching playlists:", error);
      return NextResponse.json({ error: "Failed to search playlists" }, { status: 500 });
    }

    // Format the response
    const formattedPlaylists = playlists?.map(playlist => ({
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      prompt: playlist.prompt,
      status: playlist.status,
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
    })) || [];

    return NextResponse.json({ 
      playlists: formattedPlaylists,
      total: formattedPlaylists.length,
      limit,
      offset
    });

  } catch (error) {
    console.error("Search playlists error:", error);
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