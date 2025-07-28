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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const favoritesOnly = searchParams.get('favorites') === 'true' || searchParams.get('favoritesOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // New filter parameters
    const genre = searchParams.get('genre');
    const mood = searchParams.get('mood');
    const energyLevel = searchParams.get('energy_level');
    const instruments = searchParams.get('instruments')?.split(',').filter(Boolean);
    const themes = searchParams.get('themes')?.split(',').filter(Boolean);
    const years = searchParams.get('years')?.split(',').filter(Boolean);
    const duration = searchParams.get('duration');
    const timeRange = searchParams.get('time_range');

    const offset = (page - 1) * limit;

    // Base query with metadata join
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
        is_favorite,
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
      .eq('user_id', user.id);

    // Apply text search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,prompt.ilike.%${search}%`);
    }

    // Apply favorites filter
    if (favoritesOnly) {
      query = query.eq('is_favorite', true);
    }

    // Apply metadata filters
    if (genre) {
      query = query.eq('playlist_metadata.primary_genre', genre);
    }
    if (mood) {
      query = query.eq('playlist_metadata.mood', mood);
    }
    if (energyLevel) {
      query = query.eq('playlist_metadata.energy_level', energyLevel);
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

    // Apply duration filter
    if (duration) {
      const durationMs = getDurationRange(duration);
      if (durationMs) {
        query = query.gte('total_duration_ms', durationMs.min).lte('total_duration_ms', durationMs.max);
      }
    }

    // Apply time range filter
    if (timeRange) {
      const dateRange = getTimeRange(timeRange);
      if (dateRange) {
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: playlists, error } = await query;

    if (error) {
      console.error("Error fetching playlists:", error);
      return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('playlists')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,prompt.ilike.%${search}%`);
    }
    if (favoritesOnly) {
      countQuery = countQuery.eq('is_favorite', true);
    }
    if (genre) {
      countQuery = countQuery.eq('playlist_metadata.primary_genre', genre);
    }
    if (mood) {
      countQuery = countQuery.eq('playlist_metadata.mood', mood);
    }
    if (energyLevel) {
      countQuery = countQuery.eq('playlist_metadata.energy_level', energyLevel);
    }
    if (instruments && instruments.length > 0) {
      countQuery = countQuery.overlaps('playlist_metadata.dominant_instruments', instruments);
    }
    if (themes && themes.length > 0) {
      countQuery = countQuery.overlaps('playlist_metadata.themes', themes);
    }
    if (years && years.length > 0) {
      countQuery = countQuery.overlaps('playlist_metadata.years', years);
    }
    if (duration) {
      const durationMs = getDurationRange(duration);
      if (durationMs) {
        countQuery = countQuery.gte('total_duration_ms', durationMs.min).lte('total_duration_ms', durationMs.max);
      }
    }
    if (timeRange) {
      const dateRange = getTimeRange(timeRange);
      if (dateRange) {
        countQuery = countQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
      }
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting playlists:", countError);
      return NextResponse.json({ error: "Failed to count playlists" }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Format playlists
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
      is_favorite: playlist.is_favorite,
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
      viewed_at: playlist.viewed_at,
      cover_art_url: playlist.cover_art_url,
      cover_art_description: playlist.cover_art_description,
      metadata: playlist.playlist_metadata,
    })) || [];

    return NextResponse.json({
      playlists: formattedPlaylists,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    console.error("Playlists API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Helper functions
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

function generateGradient(id: string): string {
  const gradients = [
    'from-red-400 to-pink-500',
    'from-blue-400 to-cyan-500',
    'from-green-400 to-emerald-500',
    'from-purple-400 to-pink-500',
    'from-yellow-400 to-orange-500',
    'from-indigo-400 to-purple-500',
    'from-pink-400 to-rose-500',
    'from-cyan-400 to-blue-500',
  ];
  
  // Use the ID to consistently select a gradient
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

function getDurationRange(duration: string): { min: number; max: number } | null {
  switch (duration) {
    case 'Curta (< 30min)':
      return { min: 0, max: 30 * 60 * 1000 };
    case 'Média (30-60min)':
      return { min: 30 * 60 * 1000, max: 60 * 60 * 1000 };
    case 'Longa (> 60min)':
      return { min: 60 * 60 * 1000, max: Number.MAX_SAFE_INTEGER };
    default:
      return null;
  }
}

function getTimeRange(timeRange: string): { start: string; end: string } | null {
  const now = new Date();
  let start = new Date();
  
  switch (timeRange) {
    case 'Últimos 7 dias':
      start.setDate(now.getDate() - 7);
      break;
    case 'Últimos 30 dias':
      start.setDate(now.getDate() - 30);
      break;
    case 'Últimos 3 meses':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'Último ano':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return null;
  }
  
  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
} 