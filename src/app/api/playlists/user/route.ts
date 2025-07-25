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
    const statusParam = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate status parameter
    const validStatuses = ['draft', 'published', 'private'];
    const status = validStatuses.includes(statusParam) ? statusParam as 'draft' | 'published' | 'private' : 'all';

    const offset = (page - 1) * limit;

    // Base query
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
        updated_at
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: playlists, error, count } = await query;

    if (error) {
      console.error("Error fetching user playlists:", error);
      return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Format duration for each playlist
    const formattedPlaylists = playlists?.map(playlist => ({
      ...playlist,
      duration: formatDuration(playlist.total_duration_ms),
      gradient: generateGradient(playlist.id), // Generate consistent gradient based on ID
    })) || [];

    return NextResponse.json({
      playlists: formattedPlaylists,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNextPage: offset + limit < (totalCount || 0),
        hasPreviousPage: page > 1,
      }
    });

  } catch (error) {
    console.error("Get user playlists error:", error);
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