import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  console.log("🔧 Starting track count fix...");
  
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

    // Get all playlists for the user
    const { data: playlists, error: playlistsError } = await supabase
      .from('playlists')
      .select('id, title, total_tracks')
      .eq('user_id', user.id);

    if (playlistsError) {
      console.error("Error fetching playlists:", playlistsError);
      return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
    }

    let fixedCount = 0;
    const results = [];

    // Check each playlist
    for (const playlist of playlists || []) {
      // Count actual tracks in playlist_tracks table
      const { count: actualTrackCount, error: countError } = await supabase
        .from('playlist_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlist.id);

      if (countError) {
        console.error(`Error counting tracks for playlist ${playlist.id}:`, countError);
        continue;
      }

      const actualCount = actualTrackCount || 0;
      const storedCount = playlist.total_tracks || 0;

      // If counts don't match, fix it
      if (actualCount !== storedCount) {
        console.log(`🔧 Fixing playlist "${playlist.title}": ${storedCount} → ${actualCount} tracks`);
        
        const { error: updateError } = await supabase
          .from('playlists')
          .update({ total_tracks: actualCount })
          .eq('id', playlist.id);

        if (updateError) {
          console.error(`Error updating playlist ${playlist.id}:`, updateError);
          results.push({
            playlist_id: playlist.id,
            title: playlist.title,
            old_count: storedCount,
            new_count: actualCount,
            status: 'error',
            error: updateError.message
          });
        } else {
          fixedCount++;
          results.push({
            playlist_id: playlist.id,
            title: playlist.title,
            old_count: storedCount,
            new_count: actualCount,
            status: 'fixed'
          });
        }
      } else {
        results.push({
          playlist_id: playlist.id,
          title: playlist.title,
          old_count: storedCount,
          new_count: actualCount,
          status: 'correct'
        });
      }
    }

    console.log(`✅ Track count fix completed: ${fixedCount} playlists fixed`);

    return NextResponse.json({
      success: true,
      fixed_count: fixedCount,
      total_playlists: playlists?.length || 0,
      results
    });

  } catch (error) {
    console.error("❌ Track count fix error:", error);
    return NextResponse.json(
      { error: "Failed to fix track counts" },
      { status: 500 }
    );
  }
} 