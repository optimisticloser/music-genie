import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function POST(
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

    // Check if playlist exists and belongs to user
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id, viewed_at')
      .eq('id', playlistId)
      .eq('user_id', user.id)
      .single();

    if (playlistError || !playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Only update if not already viewed
    if (!playlist.viewed_at) {
      const { error: updateError } = await supabase
        .from('playlists')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Error marking playlist as viewed:", updateError);
        return NextResponse.json({ error: "Failed to mark playlist as viewed" }, { status: 500 });
      }

      console.log(`✅ Playlist ${playlistId} marked as viewed`);
    }

    return NextResponse.json({ 
      success: true,
      playlist_id: playlistId,
      viewed_at: playlist.viewed_at || new Date().toISOString()
    });

  } catch (error) {
    console.error("Mark playlist as viewed error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 