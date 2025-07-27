import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🎨 Checking cover art status for playlist:", params.id);
  
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

    // Buscar a playlist e verificar se tem capa gerada
    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .select(`
        id,
        title,
        cover_art_url,
        cover_art_description,
        cover_art_metadata,
        created_at
      `)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (playlistError) {
      console.error("Error fetching playlist:", playlistError);
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const hasCoverArt = !!playlist.cover_art_url;
    const coverMetadata = playlist.cover_art_metadata || {};

    return NextResponse.json({
      playlist_id: playlist.id,
      title: playlist.title,
      has_cover_art: hasCoverArt,
      cover_art_url: playlist.cover_art_url,
      cover_art_description: playlist.cover_art_description,
      metadata: coverMetadata,
      created_at: playlist.created_at,
    });

  } catch (error) {
    console.error("❌ Cover status check error:", error);
    return NextResponse.json(
      { error: "Failed to check cover status" },
      { status: 500 }
    );
  }
} 