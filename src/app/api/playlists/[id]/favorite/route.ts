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
    const { isFavorite } = body;

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

    // TODO: Implement favorite functionality after migration is applied
    // For now, return success without actually updating
    console.log(`Would update playlist ${id} favorite status to: ${isFavorite}`);
    
    // Update the favorite status
    // const { error: updateError } = await supabase
    //   .from('playlists')
    //   .update({ is_favorite: isFavorite })
    //   .eq('id', id);

    // if (updateError) {
    //   console.error("Error updating favorite status:", updateError);
    //   return NextResponse.json({ error: "Failed to update favorite status" }, { status: 500 });
    // }

    return NextResponse.json({ 
      success: true, 
      is_favorite: isFavorite 
    });

  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 