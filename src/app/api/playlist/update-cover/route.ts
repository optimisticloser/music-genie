import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  console.log("🎨 Updating playlist cover art...");
  
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

    const body = await req.json();
    console.log("📦 Request body received:", body);

    const {
      playlist_id,
      cover_art_url,
      cover_art_description,
    } = body;

    if (!playlist_id) {
      return NextResponse.json(
        { error: "playlist_id is required" },
        { status: 400 }
      );
    }

    if (!cover_art_url) {
      return NextResponse.json(
        { error: "cover_art_url is required" },
        { status: 400 }
      );
    }

    // Update the playlist with the new cover art
    const { error: updateError } = await supabase
      .from("playlists")
      .update({
        cover_art_url: cover_art_url,
        cover_art_description: cover_art_description || null,
        cover_art_metadata: {
          generated_at: new Date().toISOString(),
          source: "workflowai",
        },
      })
      .eq("id", playlist_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("❌ Error updating playlist cover art:", updateError);
      return NextResponse.json(
        { error: "Failed to update playlist cover art" },
        { status: 500 }
      );
    }

    console.log("✅ Playlist cover art updated successfully");

    return NextResponse.json({
      success: true,
      message: "Cover art updated successfully",
    });

  } catch (error) {
    console.error("❌ Cover art update error:", error);
    return NextResponse.json(
      { error: "Failed to update cover art" },
      { status: 500 }
    );
  }
} 