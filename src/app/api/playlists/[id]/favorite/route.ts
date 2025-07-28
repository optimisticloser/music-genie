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

    const { id } = await params;
    const body = await req.json();
    
    // Accept both isFavorite and is_favorite for backward compatibility
    const isFavorite = body.isFavorite !== undefined ? body.isFavorite : body.is_favorite;

    if (isFavorite === undefined) {
      return NextResponse.json({ error: "Missing is_favorite field" }, { status: 400 });
    }

    // First, check if the playlist exists and belongs to the user
    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    if (playlist.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the favorite status
    const { error: updateError } = await supabase
      .from('playlists')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (updateError) {
      console.error("Error updating favorite status:", updateError);
      return NextResponse.json({ error: "Failed to update favorite status" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      is_favorite: isFavorite 
    });

  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 